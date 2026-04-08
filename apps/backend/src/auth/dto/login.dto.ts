import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEmail,
} from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  phone?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
