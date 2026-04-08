import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

type AuthenticatedUser = Omit<
  Awaited<ReturnType<UsersService['findByEmailOrPhone']>>,
  'passwordHash'
>;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    identifier: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    try {
      const user = await this.usersService.findByEmailOrPhone(identifier);
      if (user && (await bcrypt.compare(password, user.passwordHash))) {
        // Remove password before returning user object
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash: _passwordHash, ...result } = user;
        return result;
      }
    } catch {
      return null;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const identifier = loginDto.email || loginDto.phone;
    if (!identifier) {
      throw new UnauthorizedException('Email or phone is required');
    }
    const user = await this.validateUser(identifier, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token: string = this.jwtService.sign(payload);
    return {
      access_token,
      user,
    };
  }
}

