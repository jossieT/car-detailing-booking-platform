import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

type AuthenticatedUser = Omit<
  Awaited<ReturnType<UsersService['findByPhone']>>,
  'passwordHash'
>;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    phone: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    const user = await this.usersService.findByPhone(phone);
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      // Remove password before returning user object
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const { phone, password } = loginDto;
    const user = await this.validateUser(phone, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { sub: user.id, phone, role: user.role };
    const access_token: string = this.jwtService.sign(payload);
    return {
      access_token,
      user,
    };
  }
}
