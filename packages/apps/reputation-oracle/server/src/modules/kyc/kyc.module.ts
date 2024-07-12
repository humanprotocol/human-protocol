import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { KycRepository } from './kyc.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KycEntity } from './kyc.entity';
import { UserModule } from '../user/user.module';
import { Web3Module } from '../web3/web3.module';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([KycEntity]),
    ConfigModule,
    HttpModule,
    Web3Module,
  ],
  providers: [KycService, KycRepository],
  controllers: [KycController],
  exports: [KycService],
})
export class KycModule {}
