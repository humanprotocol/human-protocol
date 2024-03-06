import { Inject, Injectable } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { CommonHttpUtilService } from '../../common/utils/common-http-util.service';
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
import { RequestContext } from '../../common/utils/request-context.util';

@Injectable()
export class StatisticsService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private httpService: CommonHttpUtilService,
    private configService: EnvironmentConfigService,
    private readonly requestContext: RequestContext,
  ) {}
  async getOracleStats(
    command: OracleStatisticsCommand,
  ): Promise<OracleStatisticsResponse> {
    const url = command.oracle_url;
    const cachedStatistics: OracleStatisticsResponse | undefined =
      await this.cacheManager.get(url);
    if (cachedStatistics) {
      return cachedStatistics;
    }
    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${url}/stats`,
    };
    const statisticalData: OracleStatisticsResponse =
      await this.httpService.callExternalHttpUtilRequest<OracleStatisticsResponse>(
        options,
      );
    await this.cacheManager.set(
      url,
      statisticalData,
      this.configService.cacheTtlOracleStats,
    );
    return statisticalData;
  }
  async getUserStats(
    command: UserStatisticsCommand,
  ): Promise<UserStatisticsResponse> {
    const url = command.oracle_url;
    const bearerToken = this.requestContext.token
    const userCacheKey = url + bearerToken;
    const cachedStatistics: UserStatisticsResponse | undefined =
      await this.cacheManager.get(userCacheKey);
    if (cachedStatistics) {
      return cachedStatistics;
    }
    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${url}/stats/assignment`,
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    };
    const statisticalData =
      await this.httpService.callExternalHttpUtilRequest<UserStatisticsResponse>(
        options,
      );
    await this.cacheManager.set(
      userCacheKey,
      statisticalData,
      this.configService.cacheTtlUserStats,
    );
    return statisticalData;
  }
}
