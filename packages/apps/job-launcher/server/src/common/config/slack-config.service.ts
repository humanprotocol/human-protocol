import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SlackConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * The abuse notification webhook URL for sending messages to a Slack channel.
   * Required
   */
  get abuseNotificationWebhookUrl(): string {
    return this.configService.getOrThrow<string>(
      'SLACK_ABUSE_NOTIFICATION_WEBHOOK_URL',
    );
  }
}
