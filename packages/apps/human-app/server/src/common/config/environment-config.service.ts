import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
<<<<<<< HEAD

const DEFAULT_PORT = 5010;
const DEFAULT_HOST = 'localhost';
const DEFAULT_REDIS_PORT = 6379;
const DEFAULT_REDIS_HOST = DEFAULT_HOST;
const DEFAULT_REPUTATION_ORACLE_URL = '';
const DEFAULT_CACHE_TTL_ORACLE_STATS = 12 * 60 * 60;
const DEFAULT_CACHE_TTL_USER_STATS = 15 * 60;
const DEFAULT_CACHE_TTL_ORACLE_DISCOVERY = 24 * 60 * 60;
const DEFAULT_KVSTORE_ADDRESS = '0xbcB28672F826a50B03EE91B28145EAbddA73B2eD';
=======
const DEFAULT_CACHE_TTL_ORACLE_STATS = 12 * 60 * 60;
const DEFAULT_CACHE_TTL_USER_STATS = 15 * 60;
const DEFAULT_CACHE_TTL_ORACLE_DISCOVERY = 24 * 60 * 60;
const DEFAULT_CORS_ALLOWED_ORIGIN = 'http://localhost:5173';
const DEFAULT_CORS_ALLOWED_HEADERS = 'Content-Type, Accept';
>>>>>>> 583e66435c12c7261845de7abbcee9e54ac4551c
@Injectable()
export class EnvironmentConfigService {

  constructor(private configService: ConfigService) {}
  get host(): string {
<<<<<<< HEAD
    return this.configService.get<string>('HOST', DEFAULT_HOST);
  }
  get port(): number {
    return this.configService.get<number>('PORT', DEFAULT_PORT);
  }
  get reputationOracleUrl(): string {
    return this.configService.get<string>(
      'REPUTATION_ORACLE_URL',
      DEFAULT_REPUTATION_ORACLE_URL,
    );
  }
  get cachePort(): number {
    return this.configService.get<number>(
      'REDIS_PORT',
      DEFAULT_REDIS_PORT,
    );
  }
  get cacheHost(): string {
    return this.configService.get<string>(
      'REDIS_HOST',
      DEFAULT_REDIS_HOST,
    );
=======
    return this.configService.getOrThrow<string>('HOST');
  }
  get port(): number {
    return this.configService.getOrThrow<number>('PORT');
  }
  get reputationOracleUrl(): string {
    return this.configService.getOrThrow<string>('REPUTATION_ORACLE_URL');
  }
  get reputationOracleAddress(): string {
    return this.configService.getOrThrow<string>('REPUTATION_ORACLE_ADDRESS');
  }
  get cachePort(): number {
    return this.configService.getOrThrow<number>('REDIS_PORT');
  }
  get cacheHost(): string {
    return this.configService.getOrThrow<string>('REDIS_HOST');
>>>>>>> 583e66435c12c7261845de7abbcee9e54ac4551c
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

  get cacheTtlOracleDiscovery(): number {
    return this.configService.get<number>(
      'CACHE_TTL_ORACLE_DISCOVERY',
      DEFAULT_CACHE_TTL_ORACLE_DISCOVERY,
    );
  }
  get rpcUrl(): string {
<<<<<<< HEAD
    return this.configService.get<string>('RPC_URL', '') // @TODO: add default
  }
}

export const envValidator = Joi.object({
  HOST: Joi.string().default(DEFAULT_HOST),
  PORT: Joi.number().default(DEFAULT_PORT),
  REPUTATION_ORACLE_URL: Joi.string().required(),
});
=======
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
  get corsAllowedHeaders(): string {
    return this.configService.get<string>(
      'CORS_ALLOWED_HEADERS',
      DEFAULT_CORS_ALLOWED_HEADERS,
    );
  }
  get chainIdsEnabled(): string[] {
    const chainIds = this.configService.getOrThrow<string>('CHAIN_IDS_ENABLED');
    return chainIds.split(',').map((id) => id.trim());
  }
}
>>>>>>> 583e66435c12c7261845de7abbcee9e54ac4551c
