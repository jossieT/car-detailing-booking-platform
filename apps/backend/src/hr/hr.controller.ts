import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { HrService } from './hr.service';
import { CreateLeaveRequestDto, UpdateLeaveStatusDto } from './dto/leave-request.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('hr')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Post('leaves')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF) // Staff can request leave for themselves
  create(@Body() dto: CreateLeaveRequestDto) {
    return this.hrService.createLeaveRequest(dto);
  }

  @Get('leaves')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  findAll() {
    return this.hrService.findAllLeaveRequests();
  }

  @Get('staff/:id/leaves')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  findByStaff(@Param('id') id: string) {
    return this.hrService.findLeaveRequestsByStaff(id);
  }

  @Patch('leaves/:id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateLeaveStatusDto) {
    return this.hrService.updateLeaveStatus(id, dto.status);
  }
}
