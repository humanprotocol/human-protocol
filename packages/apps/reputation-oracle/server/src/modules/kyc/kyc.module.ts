import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { UserModule } from '../user';
import { Web3Module } from '../web3';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { KycRepository } from './kyc.repository';

@Module({
  imports: [UserModule, HttpModule, Web3Module],
  providers: [KycService, KycRepository],
  controllers: [KycController],
})
export class KycModule {}
