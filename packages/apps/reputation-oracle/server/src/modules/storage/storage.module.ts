import { Module } from '@nestjs/common';

import { EncryptionModule } from '../encryption';

import { StorageService } from './storage.service';

@Module({
  imports: [EncryptionModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
