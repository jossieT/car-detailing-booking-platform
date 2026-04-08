import { IsDateString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class GetAvailableSlotsDto {
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsUUID()
  serviceId: string;

  @IsNotEmpty()
  @IsUUID()
  businessId: string; // Add businessId

  @IsOptional()
  @IsUUID()
  staffId?: string;
}
