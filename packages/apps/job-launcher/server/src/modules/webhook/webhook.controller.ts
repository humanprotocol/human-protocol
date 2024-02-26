import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { Role } from '../../common/enums/role';
import { SignatureAuthGuard } from '../../common/guards';
import { JobService } from '../job/job.service';
import { HEADER_SIGNATURE_KEY } from '../../common/constants';
import { WebhookDataDto } from './webhook.dto';

@Public()
@ApiTags('Webhook')
@Controller('/webhook')
export class WebhookController {
  constructor(private readonly jobService: JobService) {}

  @ApiOperation({
    summary: 'Handle escrow failed webhook',
    description: 'Endpoint to handle an escrow failed webhook.',
  })
  @Public()
  @UseGuards(new SignatureAuthGuard([Role.Exchange]))
  @ApiResponse({
    status: 200,
    description: 'Escrow failed webhook handled successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid input parameters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @Post('/escrow-failed-webhook')
  public async handleEscrowFailedWebhook(
    @Headers(HEADER_SIGNATURE_KEY) _: string,
    @Body() data: WebhookDataDto,
  ): Promise<void> {
    await this.jobService.escrowFailedWebhook(data);
    return;
  }
}
