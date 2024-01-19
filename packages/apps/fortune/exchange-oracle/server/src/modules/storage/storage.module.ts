import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { ConfigModule } from '@nestjs/config';
import { s3Config } from '../../common/config';
import { Web3Module } from '../web3/web3.module';

@Module({
  imports: [ConfigModule.forFeature(s3Config), Web3Module],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
