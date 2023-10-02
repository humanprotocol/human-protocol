import { Body, Controller, Get, Headers, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { WebhookService } from './webhook.service';
import { WebhookIncomingDto } from './webhook.dto';
import { SignatureAuthGuard } from 'src/common/guards';
import { HEADER_SIGNATURE_KEY } from 'src/common/constants';

@Public()
@ApiTags('Webhook')
@Controller('/webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}
  
  @Public()
  @UseGuards(SignatureAuthGuard)
  @Post('/')
  public async createIncomingWebhook(
    @Headers(HEADER_SIGNATURE_KEY) _: string,
    @Body() data: WebhookIncomingDto,
  ): Promise<boolean> {
    return this.webhookService.createIncomingWebhook(data);
  }

  @Public()
  @Get('/cron/pending')
  public async processPendingCronJob(): Promise<any> {
    return this.webhookService.processPendingCronJob();
  }

  @Public()
  @Get('/cron/paid')
  public async processPaidCronJob(): Promise<any> {
    return this.webhookService.processPaidCronJob();
  }
}
