import {
  Body,
  Controller,
  HttpCode,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiBody,
} from '@nestjs/swagger';
import { HEADER_SIGNATURE_KEY } from '../../common/constants';
import { Public } from '../../common/decorators';
import { AuthSignatureRole, SignatureAuthGuard } from '../../common/guards';

import { WebhookIncomingService } from './webhook-incoming.service';
import { IncomingWebhookDto } from './webhook.dto';
import { IncomingWebhookErrorFilter } from './webhook.error.filter';

@Public()
@ApiTags('Webhook')
@Controller('/webhook')
@UseFilters(IncomingWebhookErrorFilter)
export class WebhookController {
  constructor(
    private readonly webhookIncomingService: WebhookIncomingService,
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
    await this.webhookIncomingService.createIncomingWebhook(data);
  }
}
