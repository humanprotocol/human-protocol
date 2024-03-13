import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { HttpModule } from '@nestjs/axios';
import { Web3Module } from '../web3/web3.module';
import { StorageModule } from '../storage/storage.module';
import { JobRepository } from './job.repository';
import { JobEntity } from './job.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobEntity]),
    ConfigModule,
    HttpModule,
    Web3Module,
    StorageModule,
  ],
  controllers: [JobController],
  providers: [JobService, JobRepository],
  exports: [JobService],
})
export class JobModule {}
