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
import { EncryptionModule } from '../encryption/encryption.module';
import { StorageModule } from '../storage/storage.module';
import { AuthModule } from '../auth/auth.module';
import { WebhookEntity } from '../webhook/webhook.entity';
import { WebhookRepository } from '../webhook/webhook.repository';
import { MutexManagerService } from '../mutex/mutex-manager.service';
import { QualificationModule } from '../qualification/qualification.module';
import { WhitelistModule } from '../whitelist/whitelist.module';
import { RoutingProtocolModule } from '../routing-protocol/routing-protocol.module';
import { RateModule } from '../rate/rate.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobEntity, WebhookEntity]),
    ConfigModule,
    HttpModule,
    AuthModule,
    PaymentModule,
    Web3Module,
    EncryptionModule,
    StorageModule,
    QualificationModule,
    WhitelistModule,
    RoutingProtocolModule,
    RateModule,
  ],
  controllers: [JobController],
  providers: [
    Logger,
    JobService,
    JobRepository,
    WebhookRepository,
    MutexManagerService,
  ],
  exports: [JobService],
})
export class JobModule {}
