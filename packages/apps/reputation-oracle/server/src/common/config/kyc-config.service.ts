import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KYC_API_KEY_DISABLED } from '../constants';

@Injectable()
export class KycConfigService {
  constructor(private configService: ConfigService) {}
  get apiKey(): string {
    return this.configService.get<string>('KYC_API_KEY', KYC_API_KEY_DISABLED);
  }
  get apiPrivateKey(): string {
    return this.configService.get<string>('KYC_API_PRIVATE_KEY', '');
  }
  get baseUrl(): string {
    return this.configService.get<string>(
      'KYC_BASE_URL',
      'https://stationapi.veriff.com/v1',
    );
  }
}
