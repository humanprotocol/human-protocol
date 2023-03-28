import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";

import { WebhookService } from "./webhook.service";
import { WebhookController } from "./webhook.controller";
import { WebhookCron } from "./webhook.cron";
import { StorageModule } from "../storage/storage.module";
import { HttpModule } from "@nestjs/axios";
import { WebhookOutgoingEntity } from "./webhook-outgoing.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookOutgoingEntity]),
    ConfigModule,
    StorageModule,
    HttpModule,
  ],
  controllers: [WebhookController],
  providers: [Logger, WebhookService, WebhookCron],
  exports: [WebhookService],
})
export class WebhookModule {}
