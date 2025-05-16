import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { Web3Module } from '../web3';
import { OutgoingWebhookModule } from '../webhook';

import { AbuseSlackAuthGuard } from './abuse-slack-auth.guard';
import { AbuseSlackBot } from './abuse-slack-bot';
import { AbuseController } from './abuse.controller';
import { AbuseRepository } from './abuse.repository';
import { AbuseService } from './abuse.service';

@Module({
  imports: [HttpModule, Web3Module, OutgoingWebhookModule],
  providers: [
    AbuseRepository,
    AbuseService,
    AbuseSlackBot,
    AbuseSlackAuthGuard,
  ],
  exports: [AbuseService],
  controllers: [AbuseController],
})
export class AbuseModule {}
