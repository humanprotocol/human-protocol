import { Module } from '@nestjs/common';

import { EncryptionModule } from '../../encryption';
import { StorageModule } from '../../storage';
import { Web3Module } from '../../web3';

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
