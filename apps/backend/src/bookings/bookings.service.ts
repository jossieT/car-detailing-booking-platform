import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { BookingsRepository } from './bookings.repository';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { generateServiceSlots } from './helpers/slot-generator';
import { getBusinessDayRange } from './helpers/timezone-utils';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, BookingStatus, Prisma } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(
    private readonly repository: BookingsRepository,
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async getAvailableSlots(dateString: string, serviceId: string, businessId: string, requestedStaffId?: string) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) throw new BadRequestException('Invalid date');

    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, businessId },
    });
    if (!service) throw new NotFoundException('Service not found');

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const { duration, bufferMinutes, capacity } = service;
    const candidateSlots = generateServiceSlots(date, duration, bufferMinutes, business);
    if (candidateSlots.length === 0) return [];

    const { dayStart, dayEnd } = getBusinessDayRange(date, business);
    if (dayStart.getTime() === 0 && dayEnd.getTime() === 0) return [];

    const existingBookings = await this.repository.getOverlappingBookingsForService(
      dayStart,
      dayEnd,
      serviceId,
      businessId,
    );

    const bookingBufferMs = bufferMinutes * 60000;

    const slotsWithAvailability = await Promise.all(
      candidateSlots.map(async (slot) => {
        const slotEndWithBuffer = new Date(slot.end.getTime() + bookingBufferMs);
        const slotStartWithBuffer = new Date(slot.start.getTime() - bookingBufferMs);

        const overlapCount = existingBookings.filter((b) =>
          b.startTime < slotEndWithBuffer && new Date(b.endTime.getTime() + bookingBufferMs) > slotStartWithBuffer,
        ).length;
        let available = overlapCount < capacity;

        let availableStaffId: string | undefined;
        if (available && requestedStaffId) {
          const staffFree = await this.repository.isStaffFree(
            requestedStaffId,
            slot.start,
            slot.end,
            businessId,
            bufferMinutes,
          );
          if (!staffFree) available = false;
          else availableStaffId = requestedStaffId;
        } else if (available && !requestedStaffId) {
          const freeStaff = await this.repository.findAvailableStaff(
            slot.start,
            slot.end,
            businessId,
            bufferMinutes,
          );
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
      }),
    );

    return slotsWithAvailability.filter((s) => s.available);
  }

  async createBooking(user: { userId: string; role: UserRole; businessId: string }, createBookingDto: CreateBookingDto) {
    const businessId = createBookingDto.businessId ?? user.businessId;
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }

    if (user.role !== UserRole.ADMIN && user.businessId && user.businessId !== businessId) {
      throw new ForbiddenException('Cannot create booking for another business');
    }

    const service = await this.prisma.service.findFirst({
      where: { id: createBookingDto.serviceId, businessId },
    });
    if (!service) throw new NotFoundException('Service not found');

    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

// --- CUSTOMER CREATION / LOOKUP (guest booking) ---
    let customer = await this.prisma.user.findUnique({
      where: { phone: createBookingDto.customerPhone },
    });
    if (!customer) {
      const nameParts = createBookingDto.customerName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      customer = await this.prisma.user.create({
        data: {
          email: createBookingDto.customerEmail,
          phone: createBookingDto.customerPhone,
          firstName,
          lastName,
          role: UserRole.CUSTOMER,
          isActive: true,
          businessId, // optional, could be null if a customer can belong to multiple businesses
          passwordHash: '', // guest cannot log in
        },
      });
    } else {
  // Optionally update name/email if changed
      const updateData: any = {};
      const nameParts = createBookingDto.customerName.trim().split(' ');
      const newFirstName = nameParts[0] || '';
      const newLastName = nameParts.slice(1).join(' ') || '';
      if (customer.firstName !== newFirstName) updateData.firstName = newFirstName;
      if (customer.lastName !== newLastName) updateData.lastName = newLastName;
      if (createBookingDto.customerEmail && customer.email !== createBookingDto.customerEmail) {
        updateData.email = createBookingDto.customerEmail;
      }
      if (Object.keys(updateData).length > 0) {
        customer = await this.prisma.user.update({
          where: { id: customer.id },
          data: updateData,
        });
      }
    }

    const startTime = new Date(createBookingDto.startTime);
    if (isNaN(startTime.getTime())) {
      throw new BadRequestException('Invalid start time');
    }

    const endTime = new Date(startTime.getTime() + service.duration * 60000);

    if (startTime >= endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // const expectedDurationMs = service.duration * 60000;
    // const actualDurationMs = endTime.getTime() - startTime.getTime();
    // if (actualDurationMs !== expectedDurationMs && user.role === UserRole.CUSTOMER) {
    //   throw new BadRequestException(`Booking duration must match service duration (${service.duration} mins)`);
    // }

    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const booking = await this.repository.createBookingWithLock({
          customerId: customer.id,
          serviceId: service.id,
          businessId,
          startTime,
          endTime,
          totalPrice: Number(service.basePrice),
          staffId: createBookingDto.staffId,
          notes: createBookingDto.notes,
          vehicleInfo: createBookingDto.vehicleInfo,
          idempotencyKey: createBookingDto.idempotencyKey,
        });

        setImmediate(() => {
          this.notificationService.sendBookingConfirmation(booking.id);
        });

        return booking;
      } catch (error) {
        lastError = error;
        if (error?.code === 'P2002' && attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
          continue;
        }
        throw error;
      }
    }
    throw lastError;
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