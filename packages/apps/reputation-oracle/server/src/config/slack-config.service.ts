import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SlackConfigService {
  constructor(private configService: ConfigService) {}
  get abuseWebhookUrl(): string {
    return this.configService.getOrThrow<string>('ABUSE_SLACK_WEBHOOK_URL');
  }
  get abuseOauthToken(): string {
    return this.configService.getOrThrow<string>('ABUSE_SLACK_OAUTH_TOKEN');
  }
  get abuseSigningSecret(): string {
    return this.configService.getOrThrow<string>('ABUSE_SLACK_SIGNING_SECRET');
  }
}
