import { Logger, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { UserService } from './user.service';
import { UserEntity } from './user.entity';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { PaymentModule } from '../payment/payment.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    ConfigModule,
    PaymentModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [UserController],
  providers: [Logger, UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
