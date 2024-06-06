import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SYNAPS_API_KEY_DISABLED } from '../constants';

@Injectable()
export class SynapsConfigService {
  constructor(private configService: ConfigService) {}
  get apiKey(): string {
    return this.configService.get<string>(
      'SYNAPS_API_KEY',
      SYNAPS_API_KEY_DISABLED,
    );
  }
  get webhookSecret(): string {
    return this.configService.get<string>('SYNAPS_WEBHOOK_SECRET', '');
  }
  get baseUrl(): string {
    return this.configService.get<string>(
      'SYNAPS_BASE_URL',
      'https://api.synaps.io/v4',
    );
  }
  get documentID(): string {
    return this.configService.get<string>('SYNAPS_STEP_DOCUMENT_ID', '');
  }
}
