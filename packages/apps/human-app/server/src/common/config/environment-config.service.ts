import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
const DEFAULT_CACHE_TTL_HCAPTCHA_USER_STATS = 12 * 60 * 60;
const DEFAULT_CACHE_TTL_ORACLE_STATS = 12 * 60 * 60;
const DEFAULT_CACHE_TTL_USER_STATS = 15 * 60;
const DEFAULT_CACHE_TTL_ORACLE_DISCOVERY = 24 * 60 * 60;
const DEFAULT_CACHE_TTL_DAILY_HMT_SPENT = 24 * 60 * 60;
const DEFAULT_CORS_ALLOWED_ORIGIN = 'http://localhost:5173';
const DEFAULT_CORS_ALLOWED_HEADERS = 'Content-Type, Accept';
const DEFAULT_CACHE_TTL_EXCHANGE_ORACLE_URL = 24 * 60 * 60;
@Injectable()
export class EnvironmentConfigService {
  constructor(private configService: ConfigService) {}
  get host(): string {
    return this.configService.getOrThrow<string>('HOST');
  }
  get port(): number {
    return this.configService.getOrThrow<number>('PORT');
  }
  get reputationOracleUrl(): string {
    return this.configService.getOrThrow<string>('REPUTATION_ORACLE_URL');
  }
  get reputationOracleAddress(): string {
    return this.configService
      .getOrThrow<string>('REPUTATION_ORACLE_ADDRESS')
      .toLowerCase();
  }
  get axiosRequestLoggingEnabled(): boolean {
    return (
      this.configService.get('IS_AXIOS_REQUEST_LOGGING_ENABLED') === 'true'
    );
  }
  get cachePort(): number {
    return this.configService.getOrThrow<number>('REDIS_PORT');
  }
  get cacheHost(): string {
    return this.configService.getOrThrow<string>('REDIS_HOST');
  }
  get cacheTtlOracleStats(): number {
    return this.configService.get<number>(
      'CACHE_TTL_ORACLE_STATS',
      DEFAULT_CACHE_TTL_ORACLE_STATS,
    );
  }
  get cacheTtlUserStats(): number {
    return this.configService.get<number>(
      'CACHE_TTL_USER_STATS',
      DEFAULT_CACHE_TTL_USER_STATS,
    );
  }
  get cacheTtlDailyHmtSpent(): number {
    return this.configService.get<number>(
      'CACHE_TTL_DAILY_HMT_SPENT',
      DEFAULT_CACHE_TTL_DAILY_HMT_SPENT,
    );
  }
  get cacheTtlHCaptchaUserStats(): number {
    return this.configService.get<number>(
      'CACHE_TTL_HCAPTCHA_USER_STATS',
      DEFAULT_CACHE_TTL_HCAPTCHA_USER_STATS,
    );
  }

  get cacheTtlOracleDiscovery(): number {
    return this.configService.get<number>(
      'CACHE_TTL_ORACLE_DISCOVERY',
      DEFAULT_CACHE_TTL_ORACLE_DISCOVERY,
    );
  }
  get rpcUrl(): string {
    return this.configService.getOrThrow<string>('RPC_URL');
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
  get corsAllowedHeaders(): string[] {
    return this.configService
      .get<string>('CORS_ALLOWED_HEADERS', DEFAULT_CORS_ALLOWED_HEADERS)
      .split(',');
  }
  get cacheTtlExchangeOracleUrl(): number {
    return this.configService.get<number>(
      'CACHE_TTL_EXCHANGE_ORACLE_URL',
      DEFAULT_CACHE_TTL_EXCHANGE_ORACLE_URL,
    );
  }
  get hcaptchaLabelingStatsApiUrl(): string {
    return this.configService.getOrThrow<string>(
      'HCAPTCHA_LABELING_STATS_API_URL',
    );
  }
  get hcaptchaLabelingVerifyApiUrl(): string {
    return this.configService.getOrThrow<string>(
      'HCAPTCHA_LABELING_VERIFY_API_URL',
    );
  }
  get hcaptchaLabelingApiKey(): string {
    return this.configService.getOrThrow<string>('HCAPTCHA_LABELING_API_KEY');
  }
  get chainIdsEnabled(): string[] {
    const chainIds = this.configService.getOrThrow<string>('CHAIN_IDS_ENABLED');
    return chainIds.split(',').map((id) => id.trim());
  }
}
