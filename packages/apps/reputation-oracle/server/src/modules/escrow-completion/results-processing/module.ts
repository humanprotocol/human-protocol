import { Module } from '@nestjs/common';

import { EncryptionModule } from '@/modules/encryption';
import { StorageModule } from '@/modules/storage';
import { Web3Module } from '@/modules/web3';

import { CvatResultsProcessor } from './cvat-results-processor';
import { FortuneResultsProcessor } from './fortune-results-processor';

@Module({
  imports: [EncryptionModule, StorageModule, Web3Module],
  providers: [CvatResultsProcessor, FortuneResultsProcessor],
  exports: [CvatResultsProcessor, FortuneResultsProcessor],
})
export class EscrowResultsProcessingModule {}
