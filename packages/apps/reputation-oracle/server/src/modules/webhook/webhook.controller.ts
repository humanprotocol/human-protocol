import {
  Body,
  Controller,
  Headers,
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
import { SignatureAuthGuard } from '../../common/guards';
import { Public } from '../../common/decorators';
import { WebhookIncomingService } from './webhook-incoming.service';
import { AuthSignatureRole } from '../../common/enums/role';
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

  @UseGuards(new SignatureAuthGuard([AuthSignatureRole.Recording]))
  @Post('/')
  @ApiOperation({
    summary: 'Create Incoming Webhook',
    description: 'Endpoint to create an incoming webhook.',
  })
  @ApiHeader({
    name: HEADER_SIGNATURE_KEY,
    description: 'Signature for webhook authentication.',
    required: true,
  })
  @ApiBody({ type: IncomingWebhookDto })
  @ApiResponse({
    status: 200,
    description: 'Incoming webhook created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid input parameters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content.',
  })
  public async createIncomingWebhook(
    @Body() data: IncomingWebhookDto,
    @Headers(HEADER_SIGNATURE_KEY) _: string,
  ): Promise<void> {
    await this.webhookIncomingService.createIncomingWebhook(data);
    return;
  }
}
