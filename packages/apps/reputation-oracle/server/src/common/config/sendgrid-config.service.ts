import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SENDGRID_API_KEY_DISABLED } from '../constants';

@Injectable()
export class SendgridConfigService {
  constructor(private configService: ConfigService) {}
  get apiKey(): string {
    return this.configService.get<string>(
      'SENDGRID_API_KEY',
      SENDGRID_API_KEY_DISABLED,
    );
  }
  get fromEmail(): string {
    return this.configService.get<string>(
      'SENDGRID_FROM_EMAIL',
      'app@humanprotocol.org',
    );
  }
  get fromName(): string {
    return this.configService.get<string>(
      'SENDGRID_FROM_NAME',
      'Human Protocol',
    );
  }
}
