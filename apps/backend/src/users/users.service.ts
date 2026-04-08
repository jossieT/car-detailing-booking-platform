import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { password, ...rest } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData: Prisma.UserCreateInput = {
      ...rest,
      passwordHash: hashedPassword,
    };
    try {
      return await this.prisma.user.create({
        data: userData,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Email already exists');
        }
      }
      throw error;
    }
  }

  async findAll() {
    return await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async findByPhone(phone: string) {
    const user = await this.prisma.user.findFirst({
      where: { phone },
      select: {
        id: true,
        email: true, // Needed for JWT payload parity
        passwordHash: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with phone ${phone} not found`);
    }
    return user;
  }

  async findByEmailOrPhone(identifier: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      },
      select: {
        id: true,
        email: true,
        phone: true,
        passwordHash: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { password, ...rest } = updateUserDto;
    const data: Prisma.UserUpdateInput = { ...rest };

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`User with id ${id} not found ${error}`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`User With ID ${id} not found ${error}`);
    }
  }
}
