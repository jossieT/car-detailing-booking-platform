import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { randomBytes } from 'crypto';
import { addDays } from 'date-fns';

type AuthenticatedUser = Omit<
  Awaited<ReturnType<UsersService['findByEmailOrPhone']>>,
  'passwordHash'
>;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async validateUser(
    identifier: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    try {
      const user = await this.usersService.findByEmailOrPhone(identifier);
      if (user && (await bcrypt.compare(password, user.passwordHash))) {
        if (!user.isActive) {
          return null; // User is deactivated/suspended
        }
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

    // Generate refresh token
    const refreshToken = randomBytes(64).toString('hex');
    const expiresAt = addDays(new Date(), 30); // 30 days

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      access_token,
      refresh_token: refreshToken,
      user,
    };
  }

  async refreshToken(refreshToken: string) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Generate new access token
    const payload = { sub: tokenRecord.user.id, email: tokenRecord.user.email, role: tokenRecord.user.role };
    const access_token = this.jwtService.sign(payload);

    // Optionally rotate refresh token
    const newRefreshToken = randomBytes(64).toString('hex');
    const newExpiresAt = addDays(new Date(), 30);

    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: {
        token: newRefreshToken,
        expiresAt: newExpiresAt,
      },
    });

    return {
      access_token,
      refresh_token: newRefreshToken,
    };
  }

  async revokeRefreshToken(userId: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }
}

