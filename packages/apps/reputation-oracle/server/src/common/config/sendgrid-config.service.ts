import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SENDGRID_API_KEY_DISABLED } from '../constants';

@Injectable()
export class SendgridConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * The API key used for authenticating requests to the SendGrid API.
   * Default: 'sendgrid-disabled'
   */
  get apiKey(): string {
    return this.configService.get<string>(
      'SENDGRID_API_KEY',
      SENDGRID_API_KEY_DISABLED,
    );
  }

  /**
   * The email address that will be used as the sender's address in emails sent via SendGrid.
   * Default: 'app@humanprotocol.org'
   */
  get fromEmail(): string {
    return this.configService.get<string>(
      'SENDGRID_FROM_EMAIL',
      'app@humanprotocol.org',
    );
  }

  /**
   * The name that will be used as the sender's name in emails sent via SendGrid.
   * Default: 'Human Protocol'
   */
  get fromName(): string {
    return this.configService.get<string>(
      'SENDGRID_FROM_NAME',
      'Human Protocol',
    );
  }
}
