import { Injectable } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { lastValueFrom } from 'rxjs';
import {
  UserStatisticsDetails,
  UserStatisticsResponse,
} from '../../modules/statistics/model/user-statistics.model';
import { HttpService } from '@nestjs/axios';
import {
  OracleStatisticsDetails,
  OracleStatisticsResponse,
} from '../../modules/statistics/model/oracle-statistics.model';
import {
  JobAssignmentData,
  JobAssignmentDetails,
  JobAssignmentParams,
  JobAssignmentResponse,
  JobsFetchParams,
  JobsFetchParamsData,
  JobsFetchParamsDetails,
  JobsFetchResponse,
} from '../../modules/job-assignment/model/job-assignment.model';
import {
  JobsDiscoveryParams,
  JobsDiscoveryParamsData,
  JobsDiscoveryParamsDetails,
  JobsDiscoveryResponse,
} from '../../modules/jobs-discovery/model/jobs-discovery.model';
import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { instanceToPlain } from 'class-transformer';
import { HttpMethod } from '../../common/enums/http-method';

@Injectable()
export class ExchangeOracleGateway {
  constructor(
    private httpService: HttpService,
    @InjectMapper() private mapper: Mapper,
  ) {}

  private cleanParams(obj: any): any {
    return Object.entries(obj)
      .filter(([_, v]) => v != null)
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
  }
  private toCleanObjParams(params: any): any {
    const plainParams = instanceToPlain(params);
    return this.cleanParams(plainParams);
  }
  private async callExternalHttpUtilRequest<T>(
    options: AxiosRequestConfig,
  ): Promise<T> {
    const response = await lastValueFrom(this.httpService.request(options));
    return response.data;
  }
  async fetchUserStatistics(
    details: UserStatisticsDetails,
  ): Promise<UserStatisticsResponse> {
    const options: AxiosRequestConfig = {
      method: HttpMethod.GET,
      url: `${details.exchangeOracleUrl}/stats/assignment`,
      headers: {
        Authorization: details.token,
      },
    };
    return this.callExternalHttpUtilRequest<UserStatisticsResponse>(options);
  }
  async fetchOracleStatistics(
    details: OracleStatisticsDetails,
  ): Promise<OracleStatisticsResponse> {
    const options: AxiosRequestConfig = {
      method: HttpMethod.GET,
      url: `${details.exchangeOracleUrl}/stats`,
    };
    return this.callExternalHttpUtilRequest<OracleStatisticsResponse>(options);
  }
  async fetchAssignedJobs(
    details: JobsFetchParamsDetails,
  ): Promise<JobsFetchResponse> {
    const jobFetchParamsData = this.mapper.map(
      details.data,
      JobsFetchParams,
      JobsFetchParamsData,
    );
    const reducedParams = this.toCleanObjParams(jobFetchParamsData);
    const options: AxiosRequestConfig = {
      method: HttpMethod.GET,
      url: `${details.exchangeOracleUrl}/assignment`,
      params: reducedParams,
      headers: {
        Authorization: details.token,
        Accept: 'application/json',
      },
    };
    return this.callExternalHttpUtilRequest<JobsFetchResponse>(options);
  }
  async postNewJobAssignment(
    details: JobAssignmentDetails,
  ): Promise<JobAssignmentResponse> {
    const options: AxiosRequestConfig = {
      method: HttpMethod.POST,
      url: `${details.exchangeOracleUrl}/assignment`,
      data: this.mapper.map(
        details.data,
        JobAssignmentParams,
        JobAssignmentData,
      ),
      headers: {
        Authorization: details.token,
      },
    };
    return this.callExternalHttpUtilRequest<JobAssignmentResponse>(options);
  }
  async fetchJobs(details: JobsDiscoveryParamsDetails) {
    const jobsDiscoveryParamsData = this.mapper.map(
      details.data,
      JobsDiscoveryParams,
      JobsDiscoveryParamsData,
    );
    const reducedParams = this.toCleanObjParams(jobsDiscoveryParamsData);
    const options: AxiosRequestConfig = {
      method: HttpMethod.GET,
      url: `${details.exchangeOracleUrl}/job`,
      params: reducedParams,
      headers: {
        Authorization: details.token,
        Accept: 'application/json',
      },
    };
    return this.callExternalHttpUtilRequest<JobsDiscoveryResponse>(options);
  }
}
