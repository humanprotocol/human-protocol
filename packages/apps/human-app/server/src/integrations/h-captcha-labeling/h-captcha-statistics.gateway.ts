import { Injectable } from '@nestjs/common';
import {
  GatewayConfig,
  GatewayEndpointConfig,
} from '../../common/interfaces/endpoint.interface';
import { HttpService } from '@nestjs/axios';
import { GatewayConfigService } from '../../common/config/gateway-config.service';
import { ExternalApiName } from '../../common/enums/external-api-name';
import { HCaptchaLabelingStatsEndpoints } from '../../common/enums/reputation-oracle-endpoints';
import { RequestDataType } from '../reputation-oracle/reputation-oracle.interface';
import { AxiosRequestConfig } from 'axios';
import { lastValueFrom } from 'rxjs';
import {
  UserStatsApiResponse,
  UserStatsResponse,
} from '../../modules/h-captcha/model/user-stats.model';
import { DailyHmtSpentResponse } from '../../modules/h-captcha/model/daily-hmt-spent.model';
import { GatewayEndpoints } from '../../common/config/gateway-config.types';

@Injectable()
export class HCaptchaStatisticsGateway {
  private readonly gatewayConfig: GatewayConfig;
  constructor(
    private httpService: HttpService,
    gatewayConfigService: GatewayConfigService,
  ) {
    this.gatewayConfig = gatewayConfigService.getConfig(
      ExternalApiName.HCAPTCHA_LABELING_STATS,
    );
  }
  private getEndpointOptions(
    endpointName: GatewayEndpoints,
    data?: RequestDataType,
    token?: string,
  ): AxiosRequestConfig {
    const endpointConfig: GatewayEndpointConfig =
      this.gatewayConfig.endpoints[endpointName];
    const authHeader = token ? { Authorization: token } : {};
    return {
      method: endpointConfig.method,
      url: `${this.gatewayConfig.url}${endpointConfig.endpoint}`,
      headers: {
        ...authHeader,
        ...endpointConfig.headers,
      },
      params: {
        ...endpointConfig.params,
      },
      data: data,
    } as AxiosRequestConfig;
  }
  private async handleRequestToHCaptchaLabelingApi<T>(
    options: AxiosRequestConfig,
  ): Promise<T> {
    const response = await lastValueFrom(this.httpService.request(options));
    return response.data;
  }
  async fetchDailyHmtSpent() {
    const options = this.getEndpointOptions(
      HCaptchaLabelingStatsEndpoints.DAILY_HMT_SPENT,
    );
    return this.handleRequestToHCaptchaLabelingApi<DailyHmtSpentResponse>(
      options,
    );
  }

  async fetchUserStats(email: string): Promise<UserStatsResponse> {
    const options = this.getEndpointOptions(
      HCaptchaLabelingStatsEndpoints.USER_STATS,
    );
    options.url += email;
    const response =
      await this.handleRequestToHCaptchaLabelingApi<UserStatsApiResponse>(
        options,
      );

    return {
      balance: response.balance,
      served: response.served,
      solved: response.solved,
      verified: response.verified,
      currentDateStats: Object.values(response.dropoff_data).pop(),
      currentEarningsStats: Object.values(response.earnings_data).pop()
    } as UserStatsResponse;
  }
}
