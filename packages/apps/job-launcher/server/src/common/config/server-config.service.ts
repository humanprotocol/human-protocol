import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ServerConfigService {
  constructor(private configService: ConfigService) {}
  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }
  get host(): string {
    return this.configService.get<string>('HOST', 'localhost');
  }
  get port(): number {
    return +this.configService.get<number>('PORT', 5000);
  }
  get feURL(): string {
    return this.configService.get<string>('FE_URL', 'http://localhost:3005');
  }
  get sessionSecret(): string {
    return this.configService.get<string>('SESSION_SECRET', 'session_key');
  }
  get maxRetryCount(): number {
    return +this.configService.get<number>('MAX_RETRY_COUNT', 5);
  }
  get cronSecret(): string {
    return this.configService.get<string>('CRON_SECRET', '');
  }
  get minimunFeeUsd(): number {
    return +this.configService.get<number>('MINIMUM_FEE_USD', 0.01);
  }
  get rateCacheTime(): number {
    return +this.configService.get<number>('RATE_CACHE_TIME', 30);
  }
  get coinmarketcapApiKey(): string {
    return this.configService.get<string>('COINMARKETCAP_API_KEY', '');
  }
  get coingeckoApiKey(): string {
    return this.configService.get<string>('COINGECKO_API_KEY', '');
  }
}
