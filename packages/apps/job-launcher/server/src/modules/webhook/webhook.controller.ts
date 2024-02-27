import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { Role } from '../../common/enums/role';
import { SignatureAuthGuard } from '../../common/guards';
import { HEADER_SIGNATURE_KEY } from '../../common/constants';
import { WebhookDataDto } from './webhook.dto';
import { WebhookService } from './webhook.service';

@Public()
@ApiTags('Webhook')
@Controller('/webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @UseGuards(new SignatureAuthGuard([Role.JobLauncher]))
  @Post('webhook')
  public async processWebhook(
    @Headers(HEADER_SIGNATURE_KEY) _: string,
    @Body() body: WebhookDataDto,
  ): Promise<any> {
    await this.webhookService.handleWebhook(body);
    return;
  }
}
