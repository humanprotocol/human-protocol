import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KYC_API_KEY_DISABLED } from '../constants';

@Injectable()
export class KycConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * The API key for the KYC service, used for authentication with the KYC provider's API. KYC_API_KEY_DISABLED (a constant indicating that the API key is disabled)
   * Default: 'kyc-disabled'
   */
  get apiKey(): string {
    return this.configService.get<string>('KYC_API_KEY', KYC_API_KEY_DISABLED);
  }

  /**
   * The private key associated with the KYC API, used for secure server-to-server communication.
   * Required
   */
  get apiPrivateKey(): string {
    return this.configService.getOrThrow<string>('KYC_API_PRIVATE_KEY');
  }

  /**
   * The base URL for the KYC provider's API, which is used to send verification requests and retrieve results.
   * Default: 'https://stationapi.veriff.com/v1'
   */
  get baseUrl(): string {
    return this.configService.get<string>(
      'KYC_BASE_URL',
      'https://stationapi.veriff.com/v1',
    );
  }
}
