import { Injectable } from '@nestjs/common';
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

@Injectable()
export class StatisticsService {
  constructor(private httpService: CommonHttpUtilService) {}
  async getOracleStats(
    command: OracleStatisticsCommand,
  ): Promise<OracleStatisticsResponse> {
    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${command.oracle_url}/stats`,
    };
    return await this.httpService.callExternalHttpUtilRequest<OracleStatisticsResponse>(
      options,
    );
  }
  async getUserStats(
    command: UserStatisticsCommand,
  ): Promise<UserStatisticsResponse> {
    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${command.oracle_url}/stats`,
      headers: {
        Authorization: `Bearer ${command.token}`,
      },
    };
    return await this.httpService.callExternalHttpUtilRequest<UserStatisticsResponse>(
      options,
    );
  }
}
