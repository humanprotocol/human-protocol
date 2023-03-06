import { Injectable, Logger } from "@nestjs/common";
import { WebhookService } from "./webhook.service";

@Injectable()
export class WebhookCron {
  private readonly logger = new Logger(WebhookCron.name);

  constructor(private readonly webhookService: WebhookService) {}
}
