import { Body, Controller, Post, Request } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { WebhookService } from './webhook.service';
import { WebhookIncomingDto } from './webhook.dto';

@Public()
@ApiTags('Webhook')
@Controller('/webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('/')
  public async createIncomingWebhook(
    @Request() req: any,
    @Body() data: WebhookIncomingDto,
  ): Promise<boolean> {
    return this.webhookService.createIncomingWebhook(data);
  }
}
