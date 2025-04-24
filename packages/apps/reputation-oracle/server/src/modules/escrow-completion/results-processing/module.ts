import { Module } from '@nestjs/common';

import { EncryptionModule } from '../../encryption/encryption.module';
import { StorageModule } from '../../storage/storage.module';
import { Web3Module } from '../../web3/web3.module';

import { AudinoResultsProcessor } from './audino-results-processor';
import { CvatResultsProcessor } from './cvat-results-processor';
import { FortuneResultsProcessor } from './fortune-results-processor';

@Module({
  imports: [EncryptionModule, StorageModule, Web3Module],
  providers: [
    AudinoResultsProcessor,
    CvatResultsProcessor,
    FortuneResultsProcessor,
  ],
  exports: [
    AudinoResultsProcessor,
    CvatResultsProcessor,
    FortuneResultsProcessor,
  ],
})
export class EscrowResultsProcessingModule {}
