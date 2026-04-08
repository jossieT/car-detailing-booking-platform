import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async sendBookingConfirmation(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        service: true,
        business: true,
        staff: true
      }
    });

    if (!booking) return;

    // Create in-app notification
    await this.prisma.notification.create({
      data: {
        userId: booking.customerId,
        type: 'BOOKING_CONFIRMED',
        title: 'Booking Confirmed',
        content: `Your ${booking.service.name} booking is confirmed for ${booking.startTime.toLocaleString()}`,
      }
    });

    // TODO: Send email/SMS using external service
    // await this.emailService.sendConfirmation(booking);
    // await this.smsService.sendConfirmation(booking);

    // Log the notification
    console.log(`Booking confirmation sent for booking ${bookingId}`);
  }

  async sendBookingReminder(bookingId: string) {
    // Similar implementation for reminders
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true, service: true }
    });

    if (!booking) return;

    await this.prisma.notification.create({
      data: {
        userId: booking.customerId,
        type: 'BOOKING_REMINDER',
        title: 'Upcoming Booking Reminder',
        content: `Reminder: Your ${booking.service.name} booking is tomorrow at ${booking.startTime.toLocaleString()}`,
      }
    });
  }
}