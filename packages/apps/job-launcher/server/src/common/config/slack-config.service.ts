import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SlackConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * The webhook URL for sending messages to a Slack channel.
   * Required
   */
  get webhookUrl(): string {
    return this.configService.getOrThrow<string>('SLACK_WEBHOOK_URL');
  }
}
