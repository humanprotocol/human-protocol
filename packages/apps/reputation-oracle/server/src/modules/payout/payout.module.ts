import { Module } from '@nestjs/common';

import { EncryptionModule } from '../encryption/encryption.module';
import { ReputationModule } from '../reputation/reputation.module';
import { Web3Module } from '../web3/web3.module';
import { StorageModule } from '../storage/storage.module';

import { PayoutService } from './payout.service';

@Module({
  imports: [EncryptionModule, ReputationModule, Web3Module, StorageModule],
  providers: [PayoutService],
  exports: [PayoutService],
})
export class PayoutModule {}
