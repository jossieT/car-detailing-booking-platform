import { IsString, IsEmail, IsOptional, IsPhoneNumber, MinLength } from 'class-validator';

export class SignupDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  businessName: string;

  @IsOptional()
  @IsString()
  businessAddress?: string;

  @IsOptional()
  @IsPhoneNumber()
  businessPhone?: string;

  @IsOptional()
  @IsEmail()
  businessEmail?: string;
}