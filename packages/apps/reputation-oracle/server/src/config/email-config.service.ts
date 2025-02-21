import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * The API key used for authenticating requests to the email provider API.
   * Should be overridden in stagin/production environments.
   * Default: 'disabled'
   */
  get apiKey(): string {
    return this.configService.get<string>('SENDGRID_API_KEY', 'disabled');
  }

  /**
   * The email address that will be used as the sender's address in emails.
   * Default: 'app@humanprotocol.org'
   */
  get from(): string {
    return this.configService.get<string>(
      'EMAIL_FROM',
      'app@humanprotocol.org',
    );
  }

  /**
   * The name that will be used as the sender's name in emails.
   * Default: 'Human Protocol'
   */
  get fromName(): string {
    return this.configService.get<string>('EMAIL_FROM_NAME', 'Human Protocol');
  }
}
