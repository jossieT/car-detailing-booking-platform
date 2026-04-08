import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { BookingsRepository } from './bookings.repository';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

describe('BookingsService - Availability & Slot Generation', () => {
  let service: BookingsService;
  let repository: jest.Mocked<BookingsRepository>;
  let notificationService: jest.Mocked<NotificationService>;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    // Mocking PrismaService
    const mockPrismaService = {
      service: {
        findUnique: jest.fn(),
      },
      business: {
        findUnique: jest.fn(),
      },
    };

    // Mocking BookingsRepository
    const mockBookingsRepository = {
      getOverlappingBookingsForService: jest.fn(),
      isStaffFree: jest.fn(),
      findAvailableStaff: jest.fn(),
      createBookingWithLock: jest.fn(),
    };

    // Mocking NotificationService
    const mockNotificationService = {
      sendBookingConfirmation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: BookingsRepository, useValue: mockBookingsRepository },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    repository = module.get(BookingsRepository);
    notificationService = module.get(NotificationService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAvailableSlots', () => {
    const mockService = {
      id: 'service-1',
      duration: 30, // 30 minutes
      bufferMinutes: 0,
      capacity: 1,
    };

    // Assuming BUSINESS_HOURS in constants are 9:00 to 17:00, standard test cases.
    // Date: 2026-05-13 is a Wednesday (normal working day).
    const testDateString = '2026-05-13T00:00:00Z';
    const testDate = new Date(testDateString);

    it('should throw BadRequestException if date is invalid', async () => {
      await expect(service.getAvailableSlots('invalid-date', 'service-1', 'business-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if service is not found', async () => {
      prisma.service.findUnique.mockResolvedValueOnce(null);

      await expect(service.getAvailableSlots(testDateString, 'non-existent', 'business-1')).rejects.toThrow(NotFoundException);
    });

    describe('Normal Cases', () => {
      it('should generate all slots for a completely free day', async () => {
        const mockBusiness = { id: 'business-1', timezone: 'UTC', workingHours: null, closedDays: [] };
        prisma.service.findUnique.mockResolvedValueOnce(mockService as any);
        prisma.business.findUnique.mockResolvedValueOnce(mockBusiness as any);
        repository.getOverlappingBookingsForService.mockResolvedValueOnce([]); // No existing bookings
        repository.findAvailableStaff.mockResolvedValue([{ id: 'staff-1' }]);

        const slots = await service.getAvailableSlots(testDateString, mockService.id, 'business-1');

        expect(slots.length).toBeGreaterThan(0);
        // Expect slots to start from 9 AM and be 30 mins apart based on constants (assuming 9-17)
        expect(slots[0]).toMatchObject({ available: true, staffId: 'staff-1' });
        expect(slots[0].start.getHours()).toBe(9);
        expect(slots[0].end.getHours()).toBe(9);
        expect(slots[0].end.getMinutes()).toBe(30);
      });
    });

    describe('Availability Filtering & Overlapping Bookings', () => {
      it('should remove slots that fully or partially overlap with existing bookings', async () => {
        const mockBusiness = { id: 'business-1', timezone: 'UTC', workingHours: null, closedDays: [] };
        prisma.service.findUnique.mockResolvedValueOnce(mockService as any);
        prisma.business.findUnique.mockResolvedValueOnce(mockBusiness as any);
        
        // Let's create an existing booking that overlaps the 09:30 - 10:00 slot
        const overlapStart = new Date(testDate);
        overlapStart.setHours(9, 30, 0, 0); // 09:30
        const overlapEnd = new Date(testDate);
        overlapEnd.setHours(10, 0, 0, 0); // 10:00

        repository.getOverlappingBookingsForService.mockResolvedValueOnce([
          { startTime: overlapStart, endTime: overlapEnd, staffId: 'staff-1' } as any,
        ]);
        repository.findAvailableStaff.mockResolvedValue([{ id: 'staff-2' }]);

        const slots = await service.getAvailableSlots(testDateString, mockService.id, 'business-1');

        // The 09:30 slot should be filtered out
        const overlappingSlot = slots.find(
          (s) => s.start.getTime() === overlapStart.getTime()
        );
        expect(overlappingSlot).toBeUndefined(); // Since it filters by available = true
        
        // 09:00 setting should still be available
        const earlySlot = slots.find((s) => s.start.getHours() === 9 && s.start.getMinutes() === 0);
        expect(earlySlot).toBeDefined();
        expect(earlySlot?.available).toBe(true);
      });

      it('should respect service capacity (allow overlapping if capacity > 1)', async () => {
        const mockBusiness = { id: 'business-1', timezone: 'UTC', workingHours: null, closedDays: [] };
        // Service with capacity 2
        prisma.service.findUnique.mockResolvedValueOnce({ ...mockService, capacity: 2 } as any);
        prisma.business.findUnique.mockResolvedValueOnce(mockBusiness as any);
        
        const overlapStart = new Date(testDate);
        overlapStart.setHours(10, 0, 0, 0);
        const overlapEnd = new Date(testDate);
        overlapEnd.setHours(10, 30, 0, 0);

        repository.getOverlappingBookingsForService.mockResolvedValueOnce([
          // Only 1 existing booking, capacity is 2
          { startTime: overlapStart, endTime: overlapEnd, staffId: 'staff-1' } as any,
        ]);
        repository.findAvailableStaff.mockResolvedValue([{ id: 'staff-2' }]); // Any staff free

        const slots = await service.getAvailableSlots(testDateString, mockService.id, 'business-1');

        const slot10AM = slots.find(s => s.start.getHours() === 10 && s.start.getMinutes() === 0);
        expect(slot10AM).toBeDefined(); // Still available because 1 < 2 capacity
      });
    });

    describe('Edge Cases', () => {
      it('should handle a fully booked day (return empty array)', async () => {
        const mockBusiness = { id: 'business-1', timezone: 'UTC', workingHours: null, closedDays: [] };
        prisma.service.findUnique.mockResolvedValueOnce(mockService as any);
        prisma.business.findUnique.mockResolvedValueOnce(mockBusiness as any);
        
        // Mock that EVERY possible staff is busy, causing available = false for all slots
        repository.getOverlappingBookingsForService.mockResolvedValueOnce([]); 
        repository.findAvailableStaff.mockResolvedValue([]); // No staff available anytime

        const slots = await service.getAvailableSlots(testDateString, mockService.id, 'business-1');

        expect(slots).toEqual([]); // All slots should be filtered out since available is false
      });

      it('should respect closed days (e.g. Sunday)', async () => {
        const mockBusiness = { id: 'business-1', timezone: 'UTC', workingHours: null, closedDays: [0] };
        // Date: 2026-05-10 is a Sunday
        const sundayDate = '2026-05-10T00:00:00Z';
        prisma.service.findUnique.mockResolvedValueOnce(mockService as any);
        prisma.business.findUnique.mockResolvedValueOnce(mockBusiness as any);
        
        const slots = await service.getAvailableSlots(sundayDate, mockService.id, 'business-1');

        expect(slots).toEqual([]); // Business has Sunday closed
      });

      it('should respect business-specific working hours', async () => {
        const mockBusiness = { 
          id: 'business-1', 
          timezone: 'UTC', 
          workingHours: { monday: { start: '10:00', end: '16:00' } }, 
          closedDays: [] 
        };
        prisma.service.findUnique.mockResolvedValueOnce(mockService as any);
        prisma.business.findUnique.mockResolvedValueOnce(mockBusiness as any);
        repository.getOverlappingBookingsForService.mockResolvedValueOnce([]);
        repository.findAvailableStaff.mockResolvedValue([{ id: 'staff-1' }]);

        const slots = await service.getAvailableSlots(testDateString, mockService.id, 'business-1');

        // Should start from 10 AM instead of 9 AM
        expect(slots[0].start.getHours()).toBe(10);
      });
    });
  });

  describe('createBooking (Concurrency & Double Booking)', () => {
    it('should safely delegate to repository for locking / double booking avoidance', async () => {
      // Test that the service delegates correctly to the lock-implemented repository layer.
      const mockService = { id: 'service-1', duration: 60, basePrice: 50 };
      const mockBusiness = { id: 'business-1', timezone: 'UTC' };
      prisma.service.findUnique.mockResolvedValueOnce(mockService as any);
      prisma.business.findUnique.mockResolvedValueOnce(mockBusiness as any);
      
      const startTime = new Date('2026-05-13T10:00:00Z');
      const endTime = new Date('2026-05-13T11:00:00Z');

      const dto = {
        serviceId: 'service-1',
        businessId: 'business-1',
        startTime,
        endTime,
        idempotencyKey: 'unique-key',
      };

      repository.createBookingWithLock.mockResolvedValueOnce({ id: 'booking-1' } as any);

      const result = await service.createBooking({ userId: 'user-1', role: UserRole.CUSTOMER, businessId: 'business-1' }, dto);

      expect(repository.createBookingWithLock).toHaveBeenCalledWith({
        customerId: 'user-1',
        serviceId: 'service-1',
        businessId: 'business-1',
        startTime,
        endTime,
        totalPrice: 50,
        idempotencyKey: 'unique-key',
        staffId: undefined,       // undefined since it was not in dto
        notes: undefined,
        vehicleInfo: undefined,
      });
      expect(result).toEqual({ id: 'booking-1' });
      expect(notificationService.sendBookingConfirmation).toHaveBeenCalledWith('booking-1');
    });
  });
});
