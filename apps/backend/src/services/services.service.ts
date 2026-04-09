import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createServiceDto: CreateServiceDto) {
    const {
      name,
      description,
      duration,
      basePrice,
      isActive,
      imageUrl,
      bufferMinutes,
      capacity,
      businessId,
    } = createServiceDto;

    try {
      return await this.prisma.service.create({
        data: {
          name,
          description,
          duration,
          basePrice: new Prisma.Decimal(basePrice),
          isActive: isActive ?? true,
          imageUrl,
          bufferMinutes: bufferMinutes ?? 30,
          capacity: capacity ?? 1,
          business: {
            connect: { id: businessId },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Service with the same name already exists');
      }
      throw error;
    }
  }

  async findAll(businessId?: string, includeInactive = false) {
    return this.prisma.service.findMany({
      where: {
        businessId: businessId ?? undefined,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });
    if (!service) {
      throw new NotFoundException(`Service with id ${id} not found`);
    }
    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    const data: Prisma.ServiceUpdateInput = {
      ...updateServiceDto,
    };

    if (updateServiceDto.basePrice !== undefined) {
      data.basePrice = new Prisma.Decimal(updateServiceDto.basePrice);
    }

    if (updateServiceDto.businessId) {
      data.business = { connect: { id: updateServiceDto.businessId } };
    }

    try {
      return await this.prisma.service.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Service with the same name already exists');
      }
      throw new NotFoundException(`Service with id ${id} not found`);
    }
  }

  async setActiveStatus(id: string, isActive: boolean) {
    try {
      return await this.prisma.service.update({
        where: { id },
        data: { isActive },
      });
    } catch (error) {
      throw new NotFoundException(`Service with id ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.service.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Service with id ${id} not found`);
    }
  }
}
