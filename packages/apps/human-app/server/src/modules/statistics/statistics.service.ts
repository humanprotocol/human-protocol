import { Inject, Injectable } from '@nestjs/common';
import {
  UserStatisticsCommand,
  UserStatisticsResponse,
} from './interfaces/user-statistics.interface';
import {
  OracleStatisticsCommand,
  OracleStatisticsResponse,
} from './interfaces/oracle-statistics.interface';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { ExternalApiGateway } from '../../integrations/external-api/external-api.gateway';

@Injectable()
export class StatisticsService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private externalApiGateway: ExternalApiGateway,
    private configService: EnvironmentConfigService,
  ) {}
  async getOracleStats(
    command: OracleStatisticsCommand,
  ): Promise<OracleStatisticsResponse> {
    const url = command.oracleUrl;
    const cachedStatistics: OracleStatisticsResponse | undefined =
      await this.cacheManager.get(url);
    if (cachedStatistics) {
      return cachedStatistics;
    }
    const response: OracleStatisticsResponse =
      await this.externalApiGateway.fetchOracleStatistics(command);
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
    const userCacheKey = command.oracleUrl + command.token;
    const cachedStatistics: UserStatisticsResponse | undefined =
      await this.cacheManager.get(userCacheKey);
    if (cachedStatistics) {
      return cachedStatistics;
    }
    const response = this.externalApiGateway.fetchUserStatistics(command);
    await this.cacheManager.set(
      userCacheKey,
      response,
      this.configService.cacheTtlUserStats,
    );
    return response;
  }
}
