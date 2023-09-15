import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { HEADER_SIGNATURE_KEY } from 'src/common/constants';
import { SignatureAuthGuard } from 'src/common/guards';
import { JwtAuthGuard } from 'src/common/guards/jwt.auth';
import { Public } from '../../common/decorators';
import { WebhookIncomingDto } from './webhook.dto';
import { WebhookService } from './webhook.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
