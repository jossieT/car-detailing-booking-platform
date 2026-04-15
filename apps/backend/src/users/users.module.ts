import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { CustomersController } from './customers.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController, CustomersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
