import { Module } from '@nestjs/common';

import { ReputationModule } from '../reputation/reputation.module';
import { SlackModule } from '../slack/slack.module';
import { Web3Module } from '../web3/web3.module';
import { WebhookOutgoingModule } from '../webhook/webhook-outgoing.module';
import { AbuseController } from './abuse.controller';
import { AbuseRepository } from './abuse.repository';
import { AbuseService } from './abuse.service';

@Module({
  imports: [Web3Module, ReputationModule, WebhookOutgoingModule, SlackModule],
  providers: [AbuseService, AbuseRepository],
  controllers: [AbuseController],
  exports: [AbuseService],
})
export class AbuseModule {}
