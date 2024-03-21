import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '../../common/enums/role';
import { SignatureAuthGuard } from '../../common/guards';
import { WebhookService } from './webhook.service';
import { HEADER_SIGNATURE_KEY } from '../../common/constant';
import { WebhookDto } from './webhook.dto';
import { Public } from 'src/common/decorators';

@Public()
@ApiTags('Webhook')
@Controller('/webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @UseGuards(
    new SignatureAuthGuard([Role.Recording, Role.Reputation, Role.JobLauncher]),
  )
  public async processWebhook(
    @Headers(HEADER_SIGNATURE_KEY) _: string,
    @Body() body: WebhookDto,
  ): Promise<void> {
    return this.webhookService.handleWebhook(body);
  }
}
