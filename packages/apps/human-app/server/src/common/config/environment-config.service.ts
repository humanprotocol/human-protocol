import Joi from 'joi';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

const DEFAULT_PORT = 5010;
const DEFAULT_HOST = 'localhost';
const DEFAULT_REDIS_PORT = 6379;
const DEFAULT_REDIS_HOST = DEFAULT_HOST;
const DEFAULT_REPUTATION_ORACLE_URL = '';
const DEFAULT_CACHE_TTL_ORACLE_STATS = 12 * 60 * 60;
const DEFAULT_CACHE_TTL_USER_STATS = 15 * 60;
const DEFAULT_CACHE_TTL_ORACLE_DISCOVERY = 24 * 60 * 60;
@Injectable()
export class EnvironmentConfigService {

  constructor(private configService: ConfigService) {}
  get host(): string {
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
}

export const envValidator = Joi.object({
  HOST: Joi.string().default(DEFAULT_HOST),
  PORT: Joi.number().default(DEFAULT_PORT),
  REPUTATION_ORACLE_URL: Joi.string().required(),
});
