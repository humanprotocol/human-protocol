import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { JobModule } from '../job/job.module';
import { WebhookRepository } from './webhook.repository';
import { WebhookEntity } from './webhook.entity';
import { HttpModule } from '@nestjs/axios';
import { Web3Module } from '../web3/web3.module';
import { StorageModule } from '../storage/storage.module';
import { AssignmentModule } from '../assignment/assignment.module';
import { AssignmentRepository } from '../assignment/assignment.repository';
import { AssignmentEntity } from '../assignment/assignment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookEntity, AssignmentEntity]),
    JobModule,
    Web3Module,
    ConfigModule,
    HttpModule,
    StorageModule,
    AssignmentModule,
  ],
  controllers: [WebhookController],
  providers: [Logger, WebhookService, WebhookRepository, AssignmentRepository],
  exports: [WebhookService],
})
export class WebhookModule {}
