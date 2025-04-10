import { Module } from '@nestjs/common';

import { EncryptionModuleModule } from '../encryption/encryption.module';

import { StorageService } from './storage.service';

@Module({
  imports: [EncryptionModuleModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
