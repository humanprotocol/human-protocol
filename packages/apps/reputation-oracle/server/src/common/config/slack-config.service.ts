import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SlackConfigService {
  constructor(private configService: ConfigService) {}
  get webhookUrl(): string {
    return this.configService.get<string>('SLACK_WEBHOOK_URL', '');
  }
  get signingSecret(): string {
    return this.configService.get<string>('SLACK_SIGNING_SECRET', '');
  }
}
