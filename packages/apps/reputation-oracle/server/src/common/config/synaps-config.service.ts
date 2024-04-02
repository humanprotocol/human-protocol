import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SynapsConfigService {
  constructor(private configService: ConfigService) {}
  get apiKey(): string {
    return this.configService.get<string>('SYNAPS_API_KEY', '');
  }
  get webhookSecret(): string {
    return this.configService.get<string>('SYNAPS_WEBHOOK_SECRET', '');
  }
}
