import { Business } from './../../../node_modules/.pnpm/@prisma+client@6.19.3_prism_1d040ab5215f59f0e27ddee7f0cf082e/node_modules/.prisma/client/index.d';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { ServicesModule } from './services/services.module';
import { BusinessesModule } from './businesses/businesses.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    PrismaModule,
    AuthModule,
    BookingsModule,
    ServicesModule,
    BusinessesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
