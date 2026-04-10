import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsArray,
  IsInt,
  Min,
  Max,
  IsObject,
  IsEmail,
  IsPhoneNumber,
  IsUrl,
} from 'class-validator';

export class CreateBusinessDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  timezone?: string; // defaults to "UTC" in schema, so optional

  @IsObject()
  @IsOptional()
  workingHours?: Record<string, any>; // flexible JSON structure

  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true }) // assuming 0=Sunday to 6=Saturday
  @IsOptional()
  closedDays?: number[];
}