import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SendgridConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * The API key used for authenticating requests to the SendGrid API.
   * Default: ''
   */
  get apiKey(): string {
    return this.configService.get<string>('SENDGRID_API_KEY', '');
  }

  /**
   * The email address that will be used as the sender's address in emails sent via SendGrid.
   * Default: 'job-launcher@hmt.ai'
   */
  get fromEmail(): string {
    return this.configService.get<string>(
      'SENDGRID_FROM_EMAIL',
      'job-launcher@hmt.ai',
    );
  }

  /**
   * The name that will be used as the sender's name in emails sent via SendGrid.
   * Default: 'Human Protocol Job Launcher'
   */
  get fromName(): string {
    return this.configService.get<string>(
      'SENDGRID_FROM_NAME',
      'Human Protocol Job Launcher',
    );
  }
}
