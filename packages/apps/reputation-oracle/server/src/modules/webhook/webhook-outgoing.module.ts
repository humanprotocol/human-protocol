import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Web3Module } from '../web3/web3.module';
import { WebhookOutgoingEntity } from './webhook-outgoing.entity';
import { WebhookOutgoingRepository } from './webhook-outgoing.repository';
import { WebhookOutgoingService } from './webhook-outgoing.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookOutgoingEntity]),
    ConfigModule,
    Web3Module,
    HttpModule,
  ],
  providers: [Logger, WebhookOutgoingService, WebhookOutgoingRepository],
  exports: [WebhookOutgoingService],
})
export class WebhookOutgoingModule {}
