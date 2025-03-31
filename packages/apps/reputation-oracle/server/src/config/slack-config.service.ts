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
  get signingSecrets(): string[] {
    const secrets = this.configService.get<string>('SLACK_SIGNING_SECRETS');
    return secrets ? secrets.split(',').map((secret) => secret.trim()) : [];
  }
}
