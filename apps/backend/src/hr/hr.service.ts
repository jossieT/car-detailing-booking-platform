import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveRequestDto, UpdateLeaveStatusDto } from './dto/leave-request.dto';
import { LeaveStatus } from '@prisma/client';

@Injectable()
export class HrService {
  constructor(private readonly prisma: PrismaService) {}

  async createLeaveRequest(dto: CreateLeaveRequestDto) {
    const staff = await this.prisma.user.findUnique({ where: { id: dto.staffId } });
    if (!staff) throw new NotFoundException('Staff not found');

    return this.prisma.leaveRequest.create({
      data: {
        staffId: dto.staffId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        reason: dto.reason,
        status: LeaveStatus.PENDING,
      },
    });
  }

  async findAllLeaveRequests() {
    return this.prisma.leaveRequest.findMany({
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findLeaveRequestsByStaff(staffId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { staffId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateLeaveStatus(id: string, status: LeaveStatus) {
    const req = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Leave request not found');

    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status },
      include: {
        staff: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });
  }
}
