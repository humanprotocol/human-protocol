import { Body, Controller, Header, Post, Request, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../common/decorators";
import { WebhookCreateDto } from "./dto";
import { WebhookService } from "./webhook.service";

@Public()
@ApiTags("Webhook")
@Controller("/webhook")
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post("/")
  public async createIncomingWebhook(@Request() req: any, @Body() data: WebhookCreateDto): Promise<boolean> {
    return this.webhookService.createIncomingWebhook(data);
  }
}
