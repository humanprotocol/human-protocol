import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PayoutService } from './payout.service';
import { ReputationModule } from '../reputation/reputation.module';
import { Web3Module } from '../web3/web3.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [ConfigModule, ReputationModule, Web3Module, StorageModule],
  providers: [Logger, PayoutService],
  exports: [PayoutService],
})
export class PayoutModule {}
