import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { HEADER_SIGNATURE_KEY } from '@/common/constants';
import { Public } from '@/common/decorators';
import { AuthSignatureRole, SignatureAuthGuard } from '@/common/guards';

import { IncomingWebhookService } from './webhook-incoming.service';
import { IncomingWebhookDto } from './webhook.dto';

@Public()
@ApiTags('Webhook')
@Controller('/webhook')
export class WebhookController {
  constructor(
    private readonly incomingWebhookService: IncomingWebhookService,
  ) {}

  @ApiOperation({
    summary: 'Accept incoming webhook',
    description: 'Endpoint to accept incoming webhooks',
  })
  @ApiHeader({
    name: HEADER_SIGNATURE_KEY,
    description: 'Signature for webhook authentication.',
    required: true,
  })
  @ApiBody({ type: IncomingWebhookDto })
  @ApiResponse({
    status: 202,
    description: 'Incoming webhook accepted successfully',
  })
  @UseGuards(new SignatureAuthGuard([AuthSignatureRole.RECORDING_ORACLE]))
  @Post('/')
  @HttpCode(202)
  async createIncomingWebhook(@Body() data: IncomingWebhookDto): Promise<void> {
    await this.incomingWebhookService.createIncomingWebhook(data);
  }
}
