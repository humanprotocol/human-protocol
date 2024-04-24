import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { EnvironmentVariableMissingError } from '../interfaces/custom-exceptions.interface';
const DEFAULT_CACHE_TTL_ORACLE_STATS = 12 * 60 * 60;
const DEFAULT_CACHE_TTL_USER_STATS = 15 * 60;
const DEFAULT_CACHE_TTL_ORACLE_DISCOVERY = 24 * 60 * 60;
const DEFAULT_CORS_ALLOWED_ORIGIN = 'http://localhost:5173';
const DEFAULT_CORS_ALLOWED_HEADERS = 'Content-Type, Accept';
@Injectable()
export class EnvironmentConfigService {
  constructor(private configService: ConfigService) {}
  get host(): string {
    return this.conditionallyReturnMandatoryEnvVariable<string>('HOST');
  }
  get port(): number {
    return this.conditionallyReturnMandatoryEnvVariable<number>('PORT');
  }
  get reputationOracleUrl(): string {
    return this.conditionallyReturnMandatoryEnvVariable<string>(
      'REPUTATION_ORACLE_URL',
    );
  }
  get cachePort(): number {
    return this.conditionallyReturnMandatoryEnvVariable<number>('REDIS_PORT');
  }
  get cacheHost(): string {
    return this.conditionallyReturnMandatoryEnvVariable<string>('REDIS_HOST');
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
    return this.conditionallyReturnMandatoryEnvVariable<string>('RPC_URL');
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
      DEFAULT_CORS_ALLOWED_HEADERS
    );
  }
  conditionallyReturnMandatoryEnvVariable<T>(envName: string): T {
    const value = this.configService.get<T>(envName);
    if (!value) {
      throw new EnvironmentVariableMissingError(envName);
    }
    return value;
  }
  checkMandatoryConfig(): void {
    const mandatoryVariables = [
      'HOST',
      'PORT',
      'REPUTATION_ORACLE_URL',
      'REDIS_PORT',
      'REDIS_HOST',
      'RPC_URL',
    ];
    const missingVariables: string[] = [];

    mandatoryVariables.forEach((variable) => {
      if (!this.configService.get(variable)) {
        missingVariables.push(variable);
      }
    });

    if (missingVariables.length > 0) {
      throw new EnvironmentVariableMissingError(missingVariables.join(', '));
    }
  }
}
