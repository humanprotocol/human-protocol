import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AbuseSlackBot } from './abuse.slack-bot';
import { AbuseRepository } from './abuse.repository';
import { AbuseService } from './abuse.service';
import { Web3Module } from '../web3/web3.module';
import { ReputationModule } from '../reputation/reputation.module';
import { WebhookOutgoingModule } from '../webhook/webhook-outgoing.module';

@Module({
  imports: [HttpModule, Web3Module, ReputationModule, WebhookOutgoingModule],
  providers: [AbuseRepository, AbuseService, AbuseSlackBot],
  exports: [AbuseService],
})
export class AbuseModule {}
