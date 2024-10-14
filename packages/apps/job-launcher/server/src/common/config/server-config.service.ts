import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ServerConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * The environment in which the server is running (e.g., 'development', 'production').
   * Default: 'development'
   */
  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  /**
   * The hostname or IP address on which the server will run.
   * Default: 'localhost'
   */
  get host(): string {
    return this.configService.get<string>('HOST', 'localhost');
  }

  /**
   * The port number on which the server will listen for incoming connections.
   * Default: 5000
   */
  get port(): number {
    return +this.configService.get<number>('PORT', 5000);
  }

  /**
   * The URL of the frontend application that the server will communicate with.
   * Default: 'http://localhost:3005'
   */
  get feURL(): string {
    return this.configService.get<string>('FE_URL', 'http://localhost:3005');
  }

  /**
   * The maximum number of retry attempts for certain operations.
   * Default: 5
   */
  get maxRetryCount(): number {
    return +this.configService.get<number>('MAX_RETRY_COUNT', 5);
  }

  /**
   * The minimum transaction fee in USD.
   * Default: 0.01
   */
  get minimunFeeUsd(): number {
    return +this.configService.get<number>('MINIMUM_FEE_USD', 0.01);
  }

  /**
   * The time (in seconds) for which rate information will be cached.
   * Default: 30
   */
  get rateCacheTime(): number {
    return +this.configService.get<number>('RATE_CACHE_TIME', 30);
  }

  /**
   * The API key for accessing CoinMarketCap data.
   */
  get coinmarketcapApiKey(): string | undefined {
    return this.configService.get<string>('COINMARKETCAP_API_KEY');
  }

  /**
   * The API key for accessing CoinGecko data.
   */
  get coingeckoApiKey(): string | undefined {
    return this.configService.get<string>('COINGECKO_API_KEY');
  }
}
