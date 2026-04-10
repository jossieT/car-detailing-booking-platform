import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('businesses')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@Query('includeInactive') includeInactive?: string) {
    // If your Business model has an `isActive` field, you can filter.
    // Otherwise, just call findAll.
    return this.businessesService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.businessesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createBusinessDto: CreateBusinessDto) {
    return this.businessesService.create(createBusinessDto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ) {
    return this.businessesService.update(id, updateBusinessDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.businessesService.remove(id);
  }
}