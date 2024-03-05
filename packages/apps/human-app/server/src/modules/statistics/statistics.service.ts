import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { callExternalHttpRequest } from '../../utils/http-request-hander';

@Injectable()
export class StatisticsService {
  constructor(private httpService: HttpService) {}

  async getOracleStats(
    command: OracleStatisticsCommand,
  ): Promise<OracleStatisticsResponse> {
    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${command.oralce_url}/stats`,
    };
    return await callExternalHttpRequest<OracleStatisticsResponse>(options);
  }
  async getUserStats(
    command: UserStatisticsCommand,
  ): Promise<UserStatisticsCommand> {
    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${command.oracle_url}/stats`,
      headers: {
        Authorization: `Bearer ${command.token}`,
      },
    };
    return await callExternalHttpRequest<UserStatisticsResponse>(options);
  }
}
