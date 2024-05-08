import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { AbuseService } from './abuse.service';
import { AbuseController } from './abuse.controller';
import { AbuseRepository } from './abuse.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AbuseEntity } from './abuse.entity';
import { UserModule } from '../user/user.module';
import { Web3Module } from '../web3/web3.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([AbuseEntity]),
    HttpModule,
    Web3Module,
    StorageModule,
  ],
  providers: [AbuseService, AbuseRepository],
  controllers: [AbuseController],
  exports: [AbuseService],
})
export class AbuseModule {}
