import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStaffPerformance(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: 'COMPLETED',
        startTime: { gte: start, lte: end },
        staffId: { not: null },
      },
      include: {
        staff: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const performanceMap = new Map();

    bookings.forEach((b) => {
      if (!b.staff) return;
      const staffId = b.staff.id;
      if (!performanceMap.has(staffId)) {
        performanceMap.set(staffId, {
          staff: b.staff,
          completedBookings: 0,
          totalRevenue: 0,
        });
      }
      
      const stats = performanceMap.get(staffId);
      stats.completedBookings++;
      stats.totalRevenue += Number(b.totalPrice);
    });

    return Array.from(performanceMap.values());
  }
}
