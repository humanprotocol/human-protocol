import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HEADER_SIGNATURE_KEY } from '../../common/constants';
import { SignatureAuthGuard } from '../../common/guards';
import { Public } from '../../common/decorators';
import { WebhookIncomingDto } from './webhook.dto';
import { WebhookService } from './webhook.service';
import { Role } from '../../common/enums/role';

@Public()
@ApiTags('Webhook')
@Controller('/webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @UseGuards(new SignatureAuthGuard([Role.Recording]))
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
    await this.webhookService.processPendingCronJob();
    return;
  }

  @Public()
  @Get('/cron/paid')
  public async processPaidCronJob(): Promise<any> {
    await this.webhookService.processPaidCronJob();
    return;
  }
}
