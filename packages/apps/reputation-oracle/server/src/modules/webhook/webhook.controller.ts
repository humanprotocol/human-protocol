import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
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
import { WebhookDto } from './webhook.dto';
import { WebhookService } from './webhook.service';
import { Role } from '../../common/enums/role';

@Public()
@ApiTags('Webhook')
@Controller('/webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @UseGuards(new SignatureAuthGuard([Role.Recording]))
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
  @ApiBody({ type: WebhookDto })
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
    @Headers(HEADER_SIGNATURE_KEY) _: string,
    @Body() data: WebhookDto,
  ): Promise<void> {
    await this.webhookService.createIncomingWebhook(data);
    return;
  }
}
