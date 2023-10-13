import { HttpModule } from '@nestjs/axios';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { Web3Module } from '../web3/web3.module';
import { serverConfig } from '../../common/config';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    ConfigModule.forFeature(serverConfig),
    HttpModule,
    Web3Module,
    StorageModule,
  ],
  controllers: [JobController],
  providers: [Logger, JobService],
  exports: [JobService],
})
export class JobModule {}
