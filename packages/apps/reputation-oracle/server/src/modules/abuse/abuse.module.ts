import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { ReputationModule } from '../reputation/reputation.module';
import { SlackModule } from '../slack/slack.module';
import { StorageModule } from '../storage/storage.module';
import { Web3Module } from '../web3/web3.module';
import { WebhookOutgoingModule } from '../webhook/webhook-outgoing.module';
import { AbuseController } from './abuse.controller';
import { AbuseEntity } from './abuse.entity';
import { AbuseRepository } from './abuse.repository';
import { AbuseService } from './abuse.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AbuseEntity]),
    Web3Module,
    StorageModule,
    ReputationModule,
    WebhookOutgoingModule,
    SlackModule,
  ],
  providers: [AbuseService, AbuseRepository],
  controllers: [AbuseController],
  exports: [AbuseService],
})
export class AbuseModule {}
