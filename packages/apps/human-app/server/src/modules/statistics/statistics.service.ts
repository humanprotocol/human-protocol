import { Inject, Injectable } from '@nestjs/common';
import {
  UserStatisticsCommand,
  UserStatisticsDetails,
  UserStatisticsResponse,
} from './model/user-statistics.model';
import {
  OracleStatisticsCommand,
  OracleStatisticsDetails,
  OracleStatisticsResponse,
} from './model/oracle-statistics.model';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { ExchangeOracleGateway } from '../../integrations/exchange-oracle/exchange-oracle.gateway';
import { KvStoreGateway } from '../../integrations/kv-store/kv-store-gateway.service';

@Injectable()
export class StatisticsService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly exchangeOracleGateway: ExchangeOracleGateway,
    private readonly kvStoreGateway: KvStoreGateway,
    private readonly configService: EnvironmentConfigService,
  ) {}
  async getOracleStats(
    command: OracleStatisticsCommand,
  ): Promise<OracleStatisticsResponse> {
    const url = command.oracleAddress;
    const cachedStatistics: OracleStatisticsResponse | undefined =
      await this.cacheManager.get(url);
    if (cachedStatistics) {
      return cachedStatistics;
    }
    const exchangeOracleUrl =
      await this.kvStoreGateway.getExchangeOracleUrlByAddress(command.oracleAddress);
    const details = {
      exchangeOracleUrl: exchangeOracleUrl,
    } as OracleStatisticsDetails;
    const response: OracleStatisticsResponse =
      await this.exchangeOracleGateway.fetchOracleStatistics(details);
    await this.cacheManager.set(
      url,
      response,
      this.configService.cacheTtlOracleStats,
    );
    return response;
  }
  async getUserStats(
    command: UserStatisticsCommand,
  ): Promise<UserStatisticsResponse> {
    const userCacheKey = command.oracleAddress + command.token;
    const cachedStatistics: UserStatisticsResponse | undefined =
      await this.cacheManager.get(userCacheKey);
    if (cachedStatistics) {
      return cachedStatistics;
    }
    const exchangeOracleUrl =
      await this.kvStoreGateway.getExchangeOracleUrlByAddress(command.oracleAddress);
    const details = {
      exchangeOracleUrl: exchangeOracleUrl,
      token: command.token,
    } as UserStatisticsDetails;
    const response =
      await this.exchangeOracleGateway.fetchUserStatistics(details);
    await this.cacheManager.set(
      userCacheKey,
      response,
      this.configService.cacheTtlUserStats,
    );
    return response;
  }
}
