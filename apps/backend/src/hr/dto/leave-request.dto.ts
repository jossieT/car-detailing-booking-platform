import { IsString, IsNotEmpty, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { LeaveStatus } from '@prisma/client';

export class CreateLeaveRequestDto {
  @IsNotEmpty()
  @IsString()
  staffId: string;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateLeaveStatusDto {
  @IsNotEmpty()
  @IsEnum(LeaveStatus)
  status: LeaveStatus;
}
