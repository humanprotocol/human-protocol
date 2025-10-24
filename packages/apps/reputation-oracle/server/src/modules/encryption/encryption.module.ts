import { Module } from '@nestjs/common';

import { Web3Module } from '@/modules/web3';

import { AesEncryptionService } from './aes-encryption.service';
import { PgpEncryptionService } from './pgp-encryption.service';

@Module({
  imports: [Web3Module],
  providers: [AesEncryptionService, PgpEncryptionService],
  exports: [AesEncryptionService, PgpEncryptionService],
})
export class EncryptionModule {}
