import { Module } from '@nestjs/common';
import { ManifestService } from './manifest.service';
import { StorageModule } from '../storage/storage.module';
import { Web3Module } from '../web3/web3.module';
import { EncryptionModule } from '../encryption/encryption.module';

@Module({
  imports: [StorageModule, Web3Module, EncryptionModule],
  providers: [ManifestService],
  exports: [ManifestService],
})
export class ManifestModule {}
