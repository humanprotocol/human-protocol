import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { Role } from '../../common/enums/role';
import { SignatureAuthGuard } from '../../common/guards';
import { WebhookService } from './webhook.service';
import { WebhookDto } from './webhook.dto';
import { HEADER_SIGNATURE_KEY } from '../../common/constants';

@Public()
@ApiTags('Webhook')
@Controller('/webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @UseGuards(
    new SignatureAuthGuard([Role.Exchange, Role.Reputation, Role.JobLaucher]),
  )
  @Post()
  processWebhook(
    @Headers(HEADER_SIGNATURE_KEY) _: string,
    @Body() body: WebhookDto,
  ): Promise<any> {
    return this.webhookService.handleWebhook(body);
  }
}
