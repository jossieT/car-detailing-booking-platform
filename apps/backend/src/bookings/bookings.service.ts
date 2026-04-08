import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { BookingsRepository } from './bookings.repository';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { generateServiceSlots } from './helpers/slot-generator';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, BookingStatus, Prisma } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(
    private readonly repository: BookingsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getAvailableSlots(dateString: string, serviceId: string, requestedStaffId?: string) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) throw new BadRequestException('Invalid date');

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) throw new NotFoundException('Service not found');

    const { duration, bufferMinutes, capacity } = service;

    // Generate candidate slots (based on duration + buffer)
    const candidateSlots = generateServiceSlots(date, duration, bufferMinutes);
    if (candidateSlots.length === 0) return [];

    // Fetch all existing bookings for this service on the entire day (optimised)
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    const existingBookings = await this.repository.getOverlappingBookingsForService(
      dayStart, dayEnd, serviceId
    );

    // For each candidate slot, determine availability in memory (avoid N+1)
    const slotsWithAvailability = await Promise.all(
      candidateSlots.map(async (slot) => {
        // Count overlapping bookings in memory (fast)
        const overlapCount = existingBookings.filter(b =>
          b.startTime < slot.end && b.endTime > slot.start
        ).length;
        let available = overlapCount < capacity;

        let availableStaffId: string | undefined;
        if (available && requestedStaffId) {
          // Specific staff requested
          const staffFree = await this.repository.isStaffFree(requestedStaffId, slot.start, slot.end);
          if (!staffFree) available = false;
          else availableStaffId = requestedStaffId;
        } else if (available && !requestedStaffId) {
          // Suggest any free staff
          const freeStaff = await this.repository.findAvailableStaff(slot.start, slot.end);
          if (freeStaff.length > 0) {
            availableStaffId = freeStaff[0].id;
          } else {
            available = false;
          }
        }

        return {
          start: slot.start,
          end: slot.end,
          available,
          staffId: availableStaffId,
        };
      })
    );

    return slotsWithAvailability.filter(s => s.available);
  }

  async createBooking(user: { userId: string, role: UserRole }, createBookingDto: CreateBookingDto) {
    const service = await this.prisma.service.findUnique({
      where: { id: createBookingDto.serviceId },
    });
    if (!service) throw new NotFoundException('Service not found');

    const startTime = new Date(createBookingDto.startTime);
    const endTime = new Date(createBookingDto.endTime);

    if (startTime >= endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    const expectedDurationMs = service.duration * 60000;
    const actualDurationMs = endTime.getTime() - startTime.getTime();
    if (actualDurationMs !== expectedDurationMs && user.role === UserRole.CUSTOMER) {
      throw new BadRequestException(`Booking duration must match service duration (${service.duration} mins)`);
    }

    return this.repository.createBookingWithLock({
      customerId: user.userId,
      serviceId: service.id,
      startTime,
      endTime,
      totalPrice: Number(service.basePrice),
      staffId: createBookingDto.staffId,
      notes: createBookingDto.notes,
      vehicleInfo: createBookingDto.vehicleInfo,
      idempotencyKey: createBookingDto.idempotencyKey,
    });
  }

  async findAll(user: { userId: string; role: string }) {
    const where: Prisma.BookingWhereInput = {};
    if (user.role === UserRole.CUSTOMER) {
      where.customerId = user.userId;
    } else if (user.role === UserRole.STAFF) {
      where.staffId = user.userId;
    }
    return this.repository.findAll(where);
  }

  async findOne(id: string, user: { userId: string; role: string }) {
    const booking = await this.repository.findOne(id);
    if (!booking) throw new NotFoundException('Booking not found');

    if (user.role === UserRole.CUSTOMER && booking.customerId !== user.userId) {
      throw new ForbiddenException('Forbidden resource');
    }
    if (user.role === UserRole.STAFF && booking.staffId !== user.userId) {
      throw new ForbiddenException('Forbidden resource');
    }
    return booking;
  }

  async update(id: string, updateBookingDto: UpdateBookingDto, user: { userId: string; role: string }) {
    await this.findOne(id, user); // ensures existence and permission
    if (user.role === UserRole.CUSTOMER) {
      throw new ForbiddenException('Customers cannot update booking metadata');
    }
    return this.repository.update(id, updateBookingDto);
  }

  async cancel(id: string, user: { userId: string; role: string }) {
    const booking = await this.findOne(id, user);
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }
    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed booking');
    }
    return this.repository.update(id, { status: BookingStatus.CANCELLED });
  }
}