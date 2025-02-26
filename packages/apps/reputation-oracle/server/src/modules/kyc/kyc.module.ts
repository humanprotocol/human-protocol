import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { UserModule } from '../user/user.module';
import { Web3Module } from '../web3/web3.module';

import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { KycRepository } from './kyc.repository';

@Module({
  imports: [UserModule, HttpModule, Web3Module],
  providers: [KycService, KycRepository],
  controllers: [KycController],
})
export class KycModule {}
