// businesses.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BusinessesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBusinessDto: CreateBusinessDto) {
    const { name, address, phone, email, timezone, workingHours, closedDays } = createBusinessDto;

    try {
      return await this.prisma.business.create({
        data: {
          name,
          address,
          phone,
          email,
          timezone: timezone ?? 'UTC',
          workingHours: workingHours ,
          closedDays: closedDays ?? [],
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // Assuming name is unique (if you have a unique constraint; otherwise remove)
        throw new ConflictException('Business with the same name already exists');
      }
      throw error;
    }
  }

  async findAll(includeInactive = false) {
    // Business model doesn't have `isActive` by default; if you add it later, use this param.
    // For now, just return all businesses.
    return this.prisma.business.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        services: true,
        users: true,
        bookings: true,
      },
    });
    if (!business) {
      throw new NotFoundException(`Business with id ${id} not found`);
    }
    return business;
  }

  async update(id: string, updateBusinessDto: UpdateBusinessDto) {
    const data: Prisma.BusinessUpdateInput = { ...updateBusinessDto };

    try {
      return await this.prisma.business.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Business with the same name already exists');
      }
      throw new NotFoundException(`Business with id ${id} not found`);
    }
  }

  async remove(id: string) {
    // Check if business has related records (bookings, services, users)
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        bookings: { take: 1 },
        services: { take: 1 },
        users: { take: 1 },
      },
    });

    if (!business) {
      throw new NotFoundException(`Business with id ${id} not found`);
    }

    if (business.bookings.length > 0 || business.services.length > 0 || business.users.length > 0) {
      // Depending on your requirements, you might want to soft-delete or throw an error.
      // Here we throw a conflict to prevent orphaned records.
      throw new ConflictException(
        'Cannot delete business with existing bookings, services, or users. Archive or reassign first.'
      );
    }

    try {
      return await this.prisma.business.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Business with id ${id} not found`);
    }
  }
}