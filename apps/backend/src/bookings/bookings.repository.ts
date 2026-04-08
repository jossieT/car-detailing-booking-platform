import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, BookingStatus, UserRole } from '@prisma/client';

@Injectable()
export class BookingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Safe booking creation with capacity & staff overlap prevention using Prisma Transaction.
   */
  async createBookingWithLock(data: {
    customerId: string;
    serviceId: string;
    businessId: string; // Add businessId
    startTime: Date;
    endTime: Date;
    totalPrice: number;
    staffId?: string;
    notes?: string;
    vehicleInfo?: Record<string, any>;
    idempotencyKey: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Check idempotency key to prevent duplicate charging / booking
      const existing = await tx.booking.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
      });
      if (existing) {
        return existing;
      }

      // 2. Get service details (capacity, duration)
      const service = await tx.service.findUnique({
        where: { id: data.serviceId, businessId: data.businessId }, // Add businessId filter
      });
      if (!service) {
        throw new NotFoundException('Service not found');
      }

      // 3. Enforce capacity: count overlapping bookings for this service (excluding cancelled/no-show)
      const overlappingStatuses = [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS];
      const overlappingCount = await tx.booking.count({
        where: {
          serviceId: data.serviceId,
          businessId: data.businessId, // Add businessId filter
          status: { in: overlappingStatuses },
          startTime: { lt: data.endTime },
          endTime: { gt: data.startTime },
        },
      });
      if (overlappingCount >= service.capacity) {
        throw new ConflictException('Service capacity exceeded for this time slot.');
      }

      // 4. Assign staff (either provided or auto-assign)
      let assignedStaffId = data.staffId;

      if (assignedStaffId) {
        // Check if the requested staff is free
        const staffOverlap = await tx.booking.findFirst({
          where: {
            staffId: assignedStaffId,
            businessId: data.businessId, // Add businessId filter
            status: { in: overlappingStatuses },
            startTime: { lt: data.endTime },
            endTime: { gt: data.startTime },
          },
        });
        if (staffOverlap) {
          throw new ConflictException('The requested staff member is not available at that time.');
        }
      } else {
        // Auto-assign: Find any active STAFF member without overlapping booking
        const availableStaff = await tx.user.findFirst({
          where: {
            role: UserRole.STAFF,
            isActive: true,
            businessId: data.businessId, // Add businessId filter
            NOT: {
              staffBookings: {
                some: {
                  status: { in: overlappingStatuses },
                  startTime: { lt: data.endTime },
                  endTime: { gt: data.startTime },
                },
              },
            },
          },
        });
        if (!availableStaff) {
          throw new ConflictException('No staff members are available for the requested time slot.');
        }
        assignedStaffId = availableStaff.id;
      }

      // 5. Create booking
      return tx.booking.create({
        data: {
          customerId: data.customerId,
          staffId: assignedStaffId,
          serviceId: data.serviceId,
          businessId: data.businessId, // Add businessId
          startTime: data.startTime,
          endTime: data.endTime,
          totalPrice: new Prisma.Decimal(data.totalPrice),
          notes: data.notes,
          vehicleInfo: data.vehicleInfo ? data.vehicleInfo : Prisma.JsonNull,
          idempotencyKey: data.idempotencyKey,
          status: BookingStatus.PENDING,
        },
      });
    });
  }

  /**
   * Get all bookings that overlap a given time range (used for staff availability).
   */
  async getOverlappingBookings(startTime: Date, endTime: Date) {
    return this.prisma.booking.findMany({
      where: {
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      select: { staffId: true, startTime: true, endTime: true },
    });
  }

  /**
   * Count overlapping bookings for a specific service (used for capacity check in slot generation).
   */
  async countOverlappingBookings(startTime: Date, endTime: Date, serviceId: string): Promise<number> {
    return this.prisma.booking.count({
      where: {
        serviceId,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
        status: { notIn: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW] },
      },
    });
  }

  /**
   * Get all overlapping bookings for a service on a given day (for slot generation).
   */
  async getOverlappingBookingsForService(dayStart: Date, dayEnd: Date, serviceId: string, businessId: string) {
    return this.prisma.booking.findMany({
      where: {
        serviceId,
        businessId, // Add businessId filter
        startTime: { gte: dayStart, lte: dayEnd },
        status: { notIn: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW] },
      },
      select: { startTime: true, endTime: true },
    });
  }

  /**
   * Check if a specific staff member is free during a time range.
   */
  async isStaffFree(staffId: string, startTime: Date, endTime: Date, businessId: string): Promise<boolean> {
    const overlap = await this.prisma.booking.findFirst({
      where: {
        staffId,
        businessId, // Add businessId filter
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });
    return !overlap;
  }

  /**
   * Find all staff members who are free during a time range.
   */
  async findAvailableStaff(startTime: Date, endTime: Date, businessId: string): Promise<{ id: string }[]> {
  const busyStaff = await this.prisma.booking.findMany({
    where: {
      businessId, // Add businessId filter
      status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    select: { staffId: true },
    distinct: ['staffId'],
  });
  
  // Filter out any null staffId values
  const busyStaffIds = busyStaff
    .map(b => b.staffId)
    .filter((id): id is string => id !== null);
    
  return this.prisma.user.findMany({
    where: {
      role: UserRole.STAFF,
      isActive: true,
      businessId, // Add businessId filter
      ...(busyStaffIds.length > 0 ? { id: { notIn: busyStaffIds } } : {}),
    },
    select: { id: true },
  });
}

  async findActiveStaff() {
    return this.prisma.user.findMany({
      where: { role: UserRole.STAFF, isActive: true },
      select: { id: true },
    });
  }

  findAll(where: Prisma.BookingWhereInput) {
    return this.prisma.booking.findMany({
      where,
      include: {
        service: true,
        staff: { select: { id: true, firstName: true, lastName: true } },
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: {
        service: true,
        staff: true,
        customer: true,
        payments: true,
      },
    });
  }

  update(id: string, data: Prisma.BookingUpdateInput) {
    return this.prisma.booking.update({
      where: { id },
      data,
    });
  }
}