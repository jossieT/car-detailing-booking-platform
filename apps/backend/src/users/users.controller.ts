import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('users')
//@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async findOne(
    @Param('id') id: string,
    @Request() req: { user: { userId: string; phone: string; role: UserRole } },
  ) {
    const user = req.user; // { userId, phone, role }
    // Allow if admin OR the ID matches the authenticated user's ID
    if (user.role === UserRole.ADMIN || user.userId === id) {
      return this.usersService.findOne(id);
    }
    throw new ForbiddenException(
      "You don't have access to perform this action",
    );
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: { user: { userId: string; phone: string; role: UserRole } },
  ) {
    const user = req.user;
    if (user.role === UserRole.ADMIN || user.userId === id) {
      return this.usersService.update(id, updateUserDto);
    }
    throw new ForbiddenException(
      "You don't have access to perform this action",
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async remove(
    @Param('id') id: string,
    @Request() req: { user: { userId: string; phone: string; role: UserRole } },
  ) {
    const user = req.user;
    if (user.role === UserRole.ADMIN || user.userId == id) {
      return this.usersService.remove(id);
    }
    throw new ForbiddenException('You can only delete your own profile');
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  getProfile(
    @Request() req: { user: { userId: string; phone: string; role: UserRole } },
  ) {
    const userId = req.user.userId;
    return this.usersService.findOne(userId);
  }

  @Get('admin')
  @Roles(UserRole.ADMIN)
  adminOnly() {
    return 'This is only for admins';
  }

  @Get('moderator')
  @Roles(UserRole.ADMIN)
  moderatorOrAdmin() {
    return 'Moderator or admin area';
  }
}
