import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AbuseSlackBot } from './abuse.slack-bot';
import { AbuseRepository } from './abuse.repository';
import { AbuseService } from './abuse.service';
import { Web3Module } from '../web3/web3.module';
import { ReputationModule } from '../reputation/reputation.module';
import { WebhookOutgoingModule } from '../webhook/webhook-outgoing.module';
import { AbuseController } from './abuse.controller';

@Module({
  imports: [HttpModule, Web3Module, ReputationModule, WebhookOutgoingModule],
  providers: [AbuseRepository, AbuseService, AbuseSlackBot],
  exports: [AbuseService],
  controllers: [AbuseController],
})
export class AbuseModule {}
