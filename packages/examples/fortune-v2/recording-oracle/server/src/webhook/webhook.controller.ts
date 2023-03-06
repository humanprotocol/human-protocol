import { Controller } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { WebhookService } from "./webhook.service";

@ApiBearerAuth()
@ApiTags("Webhook")
@Controller("/webhook")
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}
}
