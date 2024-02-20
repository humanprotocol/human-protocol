import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { UserService } from './user.service';
import { UserEntity } from './user.entity';
import { UserRepository } from './user.repository';
import { UserController } from './user.controller';
import { Web3Module } from '../web3/web3.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), ConfigModule, Web3Module],
  providers: [Logger, UserService, UserRepository],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
