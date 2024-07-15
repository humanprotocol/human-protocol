import { Inject, Injectable } from '@nestjs/common';
import {
  UserStatisticsCommand,
  UserStatisticsResponse,
} from './model/user-statistics.model';
import {
  OracleStatisticsCommand,
  OracleStatisticsResponse,
} from './model/oracle-statistics.model';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { ExchangeOracleGateway } from '../../integrations/exchange-oracle/exchange-oracle.gateway';

@Injectable()
export class StatisticsService {
  get cachePrefix() {
    return 'Statistics:';
  }
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly exchangeOracleGateway: ExchangeOracleGateway,
    private readonly configService: EnvironmentConfigService,
  ) {}
  async getOracleStats(
    command: OracleStatisticsCommand,
  ): Promise<OracleStatisticsResponse> {
    const address = command.oracleAddress;
    const key = this.cachePrefix + address;
    const cachedStatistics: OracleStatisticsResponse | undefined =
      await this.cacheManager.get(this.cachePrefix + address);
    if (cachedStatistics) {
      return cachedStatistics;
    }
    const response: OracleStatisticsResponse =
      await this.exchangeOracleGateway.fetchOracleStatistics(command);
    await this.cacheManager.set(key, response, {
        ttl: this.configService.cacheTtlOracleStats,
      } as any);
    return response;
  }
  async getUserStats(
    command: UserStatisticsCommand,
  ): Promise<UserStatisticsResponse> {
    const userCacheKey = command.oracleAddress + command.walletAddress;
    const cachedStatistics: UserStatisticsResponse | undefined =
      await this.cacheManager.get(userCacheKey);
    if (cachedStatistics) {
      return cachedStatistics;
    }
    const response =
      await this.exchangeOracleGateway.fetchUserStatistics(command);
    await this.cacheManager.set(userCacheKey, response, {
      ttl: this.configService.cacheTtlUserStats,
    } as any);
    return response;
  }
}
