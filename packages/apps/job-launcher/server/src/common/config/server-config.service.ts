import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ServerConfigService {
  constructor(private configService: ConfigService) {}

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
   * Default: 'http://localhost:3002'
   */
  get feURL(): string {
    return this.configService.get<string>('FE_URL', 'http://localhost:3002');
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
  get minimumFeeUsd(): number {
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
   * The API key for accessing CoinGecko data.
   */
  get coingeckoApiKey(): string | undefined {
    return this.configService.get<string>('COINGECKO_API_KEY');
  }
  /**
   * The amount to charge abusive users.
   */
  get abuseAmount(): number {
    return +this.configService.get<number>('ABUSE_AMOUNT', 10000);
  }
}
