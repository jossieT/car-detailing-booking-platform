import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { GetAvailableSlotsDto } from './dto/get-available-slots.dto';
import { FindAllBookingsDto } from './dto/find-all-bookings.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('bookings')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /**
   * Retrieves available time slots for a given date and service.
   */
  @Get('slots')
  getAvailableSlots(@Query() query: GetAvailableSlotsDto, @Request() req: any) {
    return this.bookingsService.getAvailableSlots(
      query.date,
      query.serviceId,
      query.businessId,
      query.staffId,
      query.excludeBookingId,
    );
  }

  /**
   * Creates a new booking. Open to all authenticated users.
   */
  @Post()
  create(
    @Request() req: any,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(req.user, createBookingDto);
  }

  /**
   * Returns all bookings visible to the authenticated user.
   */
  @Get()
  findAll(@Request() req: any, @Query() query: FindAllBookingsDto) {
    return this.bookingsService.findAll(req.user, query);
  }

  /**
   * Returns a single booking by ID.
   */
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.bookingsService.findOne(id, req.user);
  }

  /**
   * Update booking status or staff. Restricted to Admin/Manager.
   */
  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  updateStatus(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @Request() req: any,
  ) {
    return this.bookingsService.update(id, updateBookingDto, req.user);
  }

  /**
   * Get available staff for a specific booking's time window.
   * Restricted to Admin, Manager, Owner.
   */
  @Get(':id/available-staff')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  getAvailableStaffForBooking(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.bookingsService.getAvailableStaffForBooking(id, req.user);
  }

  /**
   * Reassign staff for a specific booking.
   * Restricted to Admin, Manager, Owner.
   */
  @Patch(':id/staff')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  reassignStaff(
    @Param('id') id: string,
    @Body() body: { staffId: string },
    @Request() req: any,
  ) {
    return this.bookingsService.reassignStaff(id, body.staffId, req.user);
  }

  /**
   * Soft delete / cancel a booking.
   */
  @Delete(':id')
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.bookingsService.cancel(id, req.user);
  }
}
