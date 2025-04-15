import { Module } from '@nestjs/common';

import { Web3Module } from '../web3/web3.module';

import { PgpEncryptionService } from './pgp-encryption.service';

@Module({
  imports: [Web3Module],
  providers: [PgpEncryptionService],
  exports: [PgpEncryptionService],
})
export class EncryptionModule {}
