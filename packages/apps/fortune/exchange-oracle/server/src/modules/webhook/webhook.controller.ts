import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiResponse,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthSignatureRole } from '../../common/enums/role';
import { SignatureAuthGuard } from '../../common/guards';
import { WebhookService } from './webhook.service';
import { HEADER_SIGNATURE_KEY } from '../../common/constant';
import { WebhookDto } from './webhook.dto';
import { AllowedRoles } from '../../common/decorators/role';

@ApiTags('Webhook')
@Controller('/webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @UseGuards(SignatureAuthGuard)
  @AllowedRoles([
    AuthSignatureRole.Recording,
    AuthSignatureRole.Reputation,
    AuthSignatureRole.JobLauncher,
  ])
  @ApiOperation({
    summary: 'Handle Webhook Events',
    description:
      'Receives webhook events related to escrow and task operations.',
  })
  @ApiHeader({
    name: HEADER_SIGNATURE_KEY,
    description: 'Signature header for authenticating the webhook request.',
    required: true,
  })
  @ApiBody({
    description:
      'Details of the webhook event, including the type of event and associated data.',
    type: WebhookDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Webhook event processed successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request.Invalid input parameters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content.',
  })
  @HttpCode(201)
  public async processWebhook(@Body() body: WebhookDto): Promise<void> {
    return this.webhookService.handleWebhook(body);
  }
}
