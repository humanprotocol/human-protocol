import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { JobService } from './job.service';
import { JobEntity } from './job.entity';
import { JobController } from './job.controller';
import { HttpModule } from '@nestjs/axios';
import { PaymentModule } from '../payment/payment.module';
import { JobRepository } from './job.repository';
import { Web3Module } from '../web3/web3.module';
import { RoutingProtocolService } from './routing-protocol.service';
import { EncryptionModule } from '../encryption/encryption.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobEntity]),
    ConfigModule,
    HttpModule,
    PaymentModule,
    Web3Module,
    EncryptionModule,
    StorageModule,
  ],
  controllers: [JobController],
  providers: [Logger, JobService, JobRepository, RoutingProtocolService],
  exports: [JobService],
})
export class JobModule {}
