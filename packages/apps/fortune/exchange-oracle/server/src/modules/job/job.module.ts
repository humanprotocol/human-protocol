import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { HttpModule } from '@nestjs/axios';
import { Web3Module } from '../web3/web3.module';
import { s3Config } from 'src/common/config';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    ConfigModule.forFeature(s3Config),
    ConfigModule,
    HttpModule,
    Web3Module,
    StorageModule,
  ],
  controllers: [JobController],
  providers: [JobService],
})
export class JobModule {}
