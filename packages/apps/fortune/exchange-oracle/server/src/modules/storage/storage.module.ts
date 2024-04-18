import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { Web3Module } from '../web3/web3.module';

@Module({
  imports: [Web3Module],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
