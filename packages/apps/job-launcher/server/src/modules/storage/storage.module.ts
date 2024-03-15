import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { EncryptionModule } from '../encryption/encryption.module';

@Module({
  imports: [EncryptionModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
