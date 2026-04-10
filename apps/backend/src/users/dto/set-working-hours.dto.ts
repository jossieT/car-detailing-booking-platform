import { Type } from 'class-transformer';
import { IsInt, Min, Max, IsString, IsOptional, IsBoolean, Matches, ValidateNested, IsArray } from 'class-validator';

export class WorkingHourDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  startTime: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  endTime: string;

  @IsBoolean()
  @IsOptional()
  isDayOff?: boolean;
}

export class SetWorkingHoursDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHourDto)
  hours: WorkingHourDto[];
}