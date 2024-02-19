import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { ConfigModule } from '@nestjs/config';
import { s3Config } from '../../common/config';
import { EncryptionModule } from '../encryption/encryption.module';

@Module({
  imports: [ConfigModule.forFeature(s3Config), EncryptionModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
