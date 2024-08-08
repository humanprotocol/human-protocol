import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

const DEFAULT_CORS_ALLOWED_ORIGIN = 'http://localhost:3001';
const DEFAULT_CORS_ALLOWED_HEADERS = 'Content-Type, Accept';

const DEFAULT_HMT_PRICE_SOURCE =
  'https://api.coingecko.com/api/v3/simple/price?ids=human-protocol&vs_currencies=usd';
const DEFAULT_HMT_PRICE_FROM = 'human-protocol';
const DEFAULT_HMT_PRICE_TO = 'usd';
const DEFAULT_HCAPTCHA_STATS_SOURCE =
  'https://foundation-accounts.hmt.ai/support/summary-stats';
export const HCAPTCHA_STATS_START_DATE = '2022-07-01';
export const HMT_STATS_START_DATE = '2021-04-06';

@Injectable()
export class EnvironmentConfigService {
  constructor(private configService: ConfigService) {}
  get host(): string {
    return this.configService.getOrThrow<string>('HOST');
  }
  get port(): number {
    return +this.configService.getOrThrow<number>('PORT');
  }
  get isCorsEnabled(): boolean {
    return this.configService.get<boolean>('CORS_ENABLED', false);
  }
  get corsEnabledOrigin(): string {
    return this.configService.get<string>(
      'CORS_ALLOWED_ORIGIN',
      DEFAULT_CORS_ALLOWED_ORIGIN,
    );
  }
  get corsAllowedHeaders(): string {
    return this.configService.get<string>(
      'CORS_ALLOWED_HEADERS',
      DEFAULT_CORS_ALLOWED_HEADERS,
    );
  }
  get subgraphApiKey(): string {
    return this.configService.getOrThrow<string>('SUBGRAPH_API_KEY');
  }
  get hmtPriceSource(): string {
    return this.configService.get<string>(
      'HMT_PRICE_SOURCE',
      DEFAULT_HMT_PRICE_SOURCE,
    );
  }
  get hmtPriceSourceApiKey(): string {
    return this.configService.getOrThrow<string>('HMT_PRICE_SOURCE_API_KEY');
  }
  get hmtPriceFromKey(): string {
    return this.configService.get<string>(
      'HMT_PRICE_FROM',
      DEFAULT_HMT_PRICE_FROM,
    );
  }
  get hmtPriceToKey(): string {
    return this.configService.get<string>('HMT_PRICE_TO', DEFAULT_HMT_PRICE_TO);
  }

  get hCaptchaApiKey(): string {
    return this.configService.getOrThrow<string>('HCAPTCHA_API_KEY');
  }

  get hCaptchaStatsSource(): string {
    return this.configService.get<string>(
      'HCAPTCHA_STATS_SOURCE',
      DEFAULT_HCAPTCHA_STATS_SOURCE,
    );
  }
}
