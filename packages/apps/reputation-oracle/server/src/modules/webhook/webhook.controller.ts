import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { WebhookService } from './webhook.service';
import { WebhookIncomingDto } from './webhook.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.auth';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
