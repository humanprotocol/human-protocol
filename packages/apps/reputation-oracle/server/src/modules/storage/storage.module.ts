import { Module } from '@nestjs/common';

import { EncryptionModule } from '../encryption/encryption.module';

import { StorageService } from './storage.service';

@Module({
  imports: [EncryptionModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
