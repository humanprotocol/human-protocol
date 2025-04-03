import { Module } from '@nestjs/common';

import { EncryptionModuleModule } from '../encryption/encryption.module';
import { Web3Module } from '../web3/web3.module';

import { StorageService } from './storage.service';

@Module({
  imports: [EncryptionModuleModule, Web3Module],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
