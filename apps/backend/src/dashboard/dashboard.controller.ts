import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DashboardController {
  constructor(private prisma: PrismaService) {}

  @Get('stats')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async getStats(@Req() req) {
    const businessId = req.user.businessId;

    const totalBookings = await this.prisma.booking.count({
      where: { businessId },
    });

    const revenueResult = await this.prisma.booking.aggregate({
      where: { businessId, status: 'COMPLETED' },
      _sum: { totalPrice: true },
    });
    const totalRevenue = revenueResult._sum.totalPrice || 0;

    const activeServices = await this.prisma.service.count({
      where: { businessId, isActive: true },
    });

    const totalCustomers = await this.prisma.user.count({
      where: { businessId, role: 'CUSTOMER' },
    });

    const pendingBookings = await this.prisma.booking.count({
      where: { businessId, status: 'PENDING' },
    });

    const confirmedBookings = await this.prisma.booking.count({
      where: { businessId, status: 'CONFIRMED' },
    });

    return {
      totalBookings,
      totalRevenue,
      activeServices,
      totalCustomers,
      pendingBookings,
      confirmedBookings,
    };
  }

  @Get('recent-bookings')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async getRecentBookings(@Req() req) {
    const businessId = req.user.businessId;
    const limit = 5;

    const bookings = await this.prisma.booking.findMany({
      where: { businessId },
      take: limit,
      orderBy: { startTime: 'desc' },
      include: {
        customer: true,
        service: true,
        staff: true,
      },
    });

    return bookings.map(booking => ({
      id: booking.id,
      customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
      serviceName: booking.service.name,
      date: booking.startTime.toISOString().split('T')[0],
      time: booking.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: booking.status,
      amount: parseFloat(booking.totalPrice.toString()),
    }));
  }
}