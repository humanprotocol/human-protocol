import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { UserModule } from '@/modules/user';
import { Web3Module } from '@/modules/web3';

import { KycController } from './kyc.controller';
import { KycRepository } from './kyc.repository';
import { KycService } from './kyc.service';

@Module({
  imports: [UserModule, HttpModule, Web3Module],
  providers: [KycService, KycRepository],
  controllers: [KycController],
})
export class KycModule {}
