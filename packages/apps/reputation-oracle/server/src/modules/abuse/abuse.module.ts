import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { AbuseService } from './abuse.service';
import { AbuseController } from './abuse.controller';
import { AbuseRepository } from './abuse.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AbuseEntity } from './abuse.entity';
import { Web3Module } from '../web3/web3.module';
import { StorageModule } from '../storage/storage.module';
import { ReputationModule } from '../reputation/reputation.module';
import { WebhookOutgoingModule } from '../webhook/webhook-outgoing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AbuseEntity]),
    HttpModule,
    Web3Module,
    StorageModule,
    ReputationModule,
    WebhookOutgoingModule,
  ],
  providers: [AbuseService, AbuseRepository],
  controllers: [AbuseController],
  exports: [AbuseService],
})
export class AbuseModule {}
