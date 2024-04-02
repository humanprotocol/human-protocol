import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SendgridConfigService {
  constructor(private configService: ConfigService) {}
  get apiKey(): string {
    return this.configService.get<string>('SENDGRID_API_KEY', '');
  }
  get fromEmail(): string {
    return this.configService.get<string>(
      'SENDGRID_FROM_EMAIL',
      'reputation-oracle@hmt.ai',
    );
  }
  get fromName(): string {
    return this.configService.get<string>(
      'SENDGRID_FROM_NAME',
      'Human Protocol Reputation Oracle',
    );
  }
}
