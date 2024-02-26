import { HttpModule } from '@nestjs/axios';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JobService } from './job.service';
import { Web3Module } from '../web3/web3.module';
import { serverConfig, web3Config } from '../../common/config';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    ConfigModule.forFeature(serverConfig),
    ConfigModule.forFeature(web3Config),
    HttpModule,
    Web3Module,
    StorageModule,
  ],
  providers: [Logger, JobService],
  exports: [JobService],
})
export class JobModule {}
