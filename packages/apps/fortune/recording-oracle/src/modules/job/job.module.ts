import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { JobService } from './job.service';
import { Web3Module } from '../web3/web3.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [HttpModule, Web3Module, StorageModule],
  providers: [JobService],
  exports: [JobService],
})
export class JobModule {}
