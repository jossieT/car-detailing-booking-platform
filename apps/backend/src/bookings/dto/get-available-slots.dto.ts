import { IsDateString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class GetAvailableSlotsDto {
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsUUID()
  serviceId: string;

  @IsOptional()
  @IsUUID()
  staffId?: string;
}
