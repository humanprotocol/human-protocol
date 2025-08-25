import { Module } from '@nestjs/common';

import { Web3Module } from '@/modules/web3';

import { PgpEncryptionService } from './pgp-encryption.service';

@Module({
  imports: [Web3Module],
  providers: [PgpEncryptionService],
  exports: [PgpEncryptionService],
})
export class EncryptionModule {}
