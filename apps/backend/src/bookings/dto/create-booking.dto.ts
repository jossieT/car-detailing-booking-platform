import { IsUUID, IsDateString, IsOptional, IsString, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class VehicleInfoDto {
  @IsOptional()
  @IsString()
  make?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  year?: number;

  @IsOptional()
  @IsString()
  licensePlate?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class CreateBookingDto {
  @IsUUID()
  serviceId: string;

  @IsUUID()
  businessId: string; // Add businessId

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsUUID()
  staffId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleInfoDto)
  vehicleInfo?: VehicleInfoDto;

  @IsUUID()   // ensure client sends a UUID for idempotency
  idempotencyKey: string;
}