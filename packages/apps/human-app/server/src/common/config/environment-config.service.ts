import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { ChainId } from '@human-protocol/sdk';

const DEFAULT_CACHE_TTL_HCAPTCHA_USER_STATS = 12 * 60 * 60;
const DEFAULT_CACHE_TTL_ORACLE_STATS = 12 * 60 * 60;
const DEFAULT_CACHE_TTL_USER_STATS = 15 * 60;
const DEFAULT_CACHE_TTL_ORACLE_DISCOVERY = 24 * 60 * 60;
const DEFAULT_JOB_ASSIGNMENTS_DATA_RETENTION_DAYS = 45;
const DEFAULT_CACHE_TTL_DAILY_HMT_SPENT = 24 * 60 * 60;
const DEFAULT_CORS_ALLOWED_ORIGIN = 'http://localhost:5173';
const DEFAULT_CORS_ALLOWED_HEADERS =
  'Content-Type,Authorization,X-Requested-With,Accept,Origin';
const DEFAULT_CACHE_TTL_EXCHANGE_ORACLE_URL = 24 * 60 * 60;
const DEFAULT_MAX_EXECUTIONS_TO_SKIP = 32;
const DEFAULT_CACHE_TTL_JOB_TYPES = 24 * 60 * 60;
const DEFAULT_CACHE_TTL_EXCHANGE_ORACLE_REGISTRATION_NEEDED = 24 * 60 * 60;

@Injectable()
export class EnvironmentConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * The hostname or IP address on which the server will run.
   * Default: 'localhost'
   */
  get host(): string {
    return this.configService.getOrThrow<string>('HOST');
  }

  /**
   * The port number on which the server will listen for incoming connections.
   * Default: 5000
   */
  get port(): number {
    return this.configService.getOrThrow<number>('PORT');
  }

  get gitHash(): string {
    return this.configService.get<string>('GIT_HASH', '');
  }

  /**
   * The URL of the reputation oracle service.
   * Required
   */
  get reputationOracleUrl(): string {
    return this.configService.getOrThrow<string>('REPUTATION_ORACLE_URL');
  }

  /**
   * The address of the reputation oracle service.
   * Required
   */
  get reputationOracleAddress(): string {
    return this.configService
      .getOrThrow<string>('REPUTATION_ORACLE_ADDRESS')
      .toLowerCase();
  }

  /**
   * Flag indicating if Axios request logging is enabled.
   * Default: false
   */
  get axiosRequestLoggingEnabled(): boolean {
    return (
      this.configService.get('IS_AXIOS_REQUEST_LOGGING_ENABLED') === 'true'
    );
  }

  /**
   * The allowed host for the application.
   * Required
   */
  get allowedHost(): string {
    return this.configService.getOrThrow('ALLOWED_HOST');
  }

  /**
   * The port number for the Redis cache server.
   * Required
   */
  get cachePort(): number {
    return this.configService.getOrThrow<number>('REDIS_PORT');
  }

  /**
   * The hostname or IP address of the Redis cache server.
   * Required
   */
  get cacheHost(): string {
    return this.configService.getOrThrow<string>('REDIS_HOST');
  }

  /**
   * The cache time-to-live (TTL) for oracle statistics.
   * Default: 12 hours
   */
  get cacheTtlOracleStats(): number {
    return (
      this.configService.get<number>(
        'CACHE_TTL_ORACLE_STATS',
        DEFAULT_CACHE_TTL_ORACLE_STATS,
      ) * 1000
    );
  }

  /**
   * The cache time-to-live (TTL) for user statistics.
   * Default: 15 minutes
   */
  get cacheTtlUserStats(): number {
    return (
      this.configService.get<number>(
        'CACHE_TTL_USER_STATS',
        DEFAULT_CACHE_TTL_USER_STATS,
      ) * 1000
    );
  }

  /**
   * The cache time-to-live (TTL) for daily HMT spent data.
   * Default: 24 hours
   */
  get cacheTtlDailyHmtSpent(): number {
    return (
      this.configService.get<number>(
        'CACHE_TTL_DAILY_HMT_SPENT',
        DEFAULT_CACHE_TTL_DAILY_HMT_SPENT,
      ) * 1000
    );
  }

  /**
   * The cache time-to-live (TTL) for hCaptcha user statistics.
   * Default: 12 hours
   */
  get cacheTtlHCaptchaUserStats(): number {
    return (
      this.configService.get<number>(
        'CACHE_TTL_HCAPTCHA_USER_STATS',
        DEFAULT_CACHE_TTL_HCAPTCHA_USER_STATS,
      ) * 1000
    );
  }

  /**
   * The cache time-to-live (TTL) for oracle discovery.
   * Default: 24 hours
   */
  get cacheTtlOracleDiscovery(): number {
    return (
      this.configService.get<number>(
        'CACHE_TTL_ORACLE_DISCOVERY',
        DEFAULT_CACHE_TTL_ORACLE_DISCOVERY,
      ) * 1000
    );
  }

  /**
   * Number of days without updates assignments data is retained.
   * Default: 45 days
   */
  get jobAssignmentsRetentionDays(): number {
    return this.configService.get<number>(
      'JOB_ASSIGNMENTS_DATA_RETENTION_DAYS',
      DEFAULT_JOB_ASSIGNMENTS_DATA_RETENTION_DAYS,
    );
  }

  /**
   * The RPC URL used for communication.
   * Required
   */
  get rpcUrl(): string {
    return this.configService.getOrThrow<string>('RPC_URL');
  }

  /**
   * Flag indicating if CORS is enabled.
   * Default: false
   */
  get isCorsEnabled(): boolean {
    return this.configService.get<string>('CORS_ENABLED') === 'true';
  }

  /**
   * The allowed origin for CORS requests.
   * Default: 'http://localhost:5173'
   */
  get corsEnabledOrigin(): string {
    return this.configService.get<string>(
      'CORS_ALLOWED_ORIGIN',
      DEFAULT_CORS_ALLOWED_ORIGIN,
    );
  }

  /**
   * The allowed headers for CORS requests.
   * Default: 'Content-Type,Authorization,X-Requested-With,Accept,Origin'
   */
  get corsAllowedHeaders(): string[] {
    return this.configService
      .get<string>('CORS_ALLOWED_HEADERS', DEFAULT_CORS_ALLOWED_HEADERS)
      .split(',');
  }

  /**
   * The cache time-to-live (TTL) for exchange oracle URLs.
   * Default: 24 hours
   */
  get cacheTtlExchangeOracleUrl(): number {
    return (
      this.configService.get<number>(
        'CACHE_TTL_EXCHANGE_ORACLE_URL',
        DEFAULT_CACHE_TTL_EXCHANGE_ORACLE_URL,
      ) * 1000
    );
  }

  /**
   * The cache time-to-live (TTL) for job types.
   * Default: 24 hours
   */
  get cacheTtlJobTypes(): number {
    return this.configService.get<number>(
      'CACHE_TTL_JOB_TYPES',
      DEFAULT_CACHE_TTL_JOB_TYPES,
    );
  }

  /**
   * The cache time-to-live (TTL) for exchange oracle registration needed.
   * Default: 24 hours
   */
  get cacheTtlExchangeOracleRegistrationNeeded(): number {
    return (
      this.configService.get<number>(
        'CACHE_TTL_EXCHANGE_ORACLE_REGISTRATION_NEEDED',
        DEFAULT_CACHE_TTL_EXCHANGE_ORACLE_REGISTRATION_NEEDED,
      ) * 1000
    );
  }

  /**
   * The API URL for hCaptcha labeling statistics.
   * Required
   */
  get hcaptchaLabelingStatsApiUrl(): string {
    return this.configService.getOrThrow<string>(
      'HCAPTCHA_LABELING_STATS_API_URL',
    );
  }

  /**
   * The API URL for hCaptcha labeling verification.
   * Required
   */
  get hcaptchaLabelingVerifyApiUrl(): string {
    return this.configService.getOrThrow<string>(
      'HCAPTCHA_LABELING_VERIFY_API_URL',
    );
  }

  /**
   * The API key for hCaptcha labeling.
   * Required
   */
  get hcaptchaLabelingApiKey(): string {
    return this.configService.getOrThrow<string>('HCAPTCHA_LABELING_API_KEY');
  }

  /**
   * The list of enabled chain IDs.
   * Required
   */
  get chainIdsEnabled(): ChainId[] {
    const chainIds = this.configService.getOrThrow<string>('CHAIN_IDS_ENABLED');
    return chainIds
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter(
        (id): id is ChainId =>
          !isNaN(id) && Object.values(ChainId).includes(id),
      );
  }

  /**
   * Flag indicating if the cache should be restarted.
   * Default: false
   */
  get isCacheToRestart(): boolean {
    return this.configService.get('IS_CACHE_TO_RESTART') === 'true';
  }

  /**
   * The email address for the human app.
   * Required
   */
  get email(): string {
    return this.configService.getOrThrow<string>('HUMAN_APP_EMAIL');
  }

  /**
   * The password for the human app.
   * Required
   */
  get password(): string {
    return this.configService.getOrThrow<string>('HUMAN_APP_PASSWORD');
  }

  /**
   * The maximum number of iteration to skip.
   * Default: 5
   */
  get maxExecutionToSkip(): number {
    return this.configService.get<number>(
      'MAX_EXECUTIONS_TO_SKIP',
      DEFAULT_MAX_EXECUTIONS_TO_SKIP,
    );
  }

  /**
   * Feature flag for job discovery
   */
  get jobsDiscoveryFlag(): boolean {
    const flag = this.configService.get<string>(
      'FEATURE_FLAG_JOBS_DISCOVERY',
      'false',
    );
    return flag === 'true';
  }
}
