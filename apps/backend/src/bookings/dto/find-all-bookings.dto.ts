import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class FindAllBookingsDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
