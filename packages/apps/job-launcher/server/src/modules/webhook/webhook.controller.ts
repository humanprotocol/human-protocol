import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { WebhookService } from './webhook.service';

@Public()
@ApiTags('Webhook')
@Controller('/webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}
  @Public()
  @Get('/cron/launch')
  public async processPendingCronJob(): Promise<any> {
    await this.webhookService.processPendingCronJob();
    return;
  }
}
