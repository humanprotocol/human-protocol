import { Module } from '@nestjs/common';

import { Web3Module } from '../web3/web3.module';

import { StorageService } from './storage.service';

@Module({
  imports: [Web3Module],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
