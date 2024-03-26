import { Injectable } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { lastValueFrom } from 'rxjs';
import {
  UserStatisticsCommand,
  UserStatisticsResponse,
} from '../../modules/statistics/interfaces/user-statistics.interface';
import { HttpService } from '@nestjs/axios';
import {
  OracleStatisticsCommand,
  OracleStatisticsResponse,
} from '../../modules/statistics/interfaces/oracle-statistics.interface';
import {
  JobAssignmentCommand,
  JobAssignmentData,
  JobAssignmentParams,
  JobAssignmentResponse,
  JobsFetchParams,
  JobsFetchParamsCommand,
  JobsFetchParamsData,
  JobsFetchResponse,
} from '../../modules/job-assignment/interfaces/job-assignment.interface';
import {
  JobsDiscoveryParams,
  JobsDiscoveryParamsCommand,
  JobsDiscoveryParamsData,
  JobsDiscoveryResponse,
} from '../../modules/jobs-discovery/interfaces/jobs-discovery.interface';
import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class ExchangeOracleGateway {
  constructor(
    private httpService: HttpService,
    @InjectMapper() private mapper: Mapper,
  ) {
    this.initializeRequestInterceptor();
  }

  private cleanParams(obj: any): any {
    return Object.entries(obj)
      .filter(([_, v]) => v != null)
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
  }
  private toCleanObjParams(params: any): any {
    const plainParams = instanceToPlain(params);
    return this.cleanParams(plainParams);
  }
  private initializeRequestInterceptor() {
    this.httpService.axiosRef.interceptors.request.use(
      (config) => {
        console.log('Outgoing request: ', config);
        return config;
      },
      (error) => Promise.reject(error),
    );
  }
  private async callExternalHttpUtilRequest<T>(
    options: AxiosRequestConfig,
  ): Promise<T> {
    const response = await lastValueFrom(this.httpService.request(options));
    return response.data;
  }
  async fetchUserStatistics(
    command: UserStatisticsCommand,
  ): Promise<UserStatisticsResponse> {
    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${command.exchangeOracleUrl}/stats/assignment`,
      headers: {
        Authorization: command.token,
      },
    };
    return this.callExternalHttpUtilRequest<UserStatisticsResponse>(options);
  }
  async fetchOracleStatistics(
    command: OracleStatisticsCommand,
  ): Promise<OracleStatisticsResponse> {
    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${command.exchangeOracleUrl}/stats`,
    };
    return this.callExternalHttpUtilRequest<OracleStatisticsResponse>(options);
  }
  async fetchAssignedJobs(
    command: JobsFetchParamsCommand,
  ): Promise<JobsFetchResponse> {
    const jobFetchParamsData = this.mapper.map(
      command.data,
      JobsFetchParams,
      JobsFetchParamsData,
    );
    const reducedParams = this.toCleanObjParams(jobFetchParamsData);
    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${command.exchangeOracleUrl}/assignment`,
      params: reducedParams,
    };
    return this.callExternalHttpUtilRequest<JobsFetchResponse>(options);
  }
  async postNewJobAssignment(
    command: JobAssignmentCommand,
  ): Promise<JobAssignmentResponse> {
    const options: AxiosRequestConfig = {
      method: 'POST',
      url: `${command.exchangeOracleUrl}/assignment`,
      data: this.mapper.map(
        command.data,
        JobAssignmentParams,
        JobAssignmentData,
      ),
      headers: {
        Authorization: command.token,
      },
    };
    return this.callExternalHttpUtilRequest<JobAssignmentResponse>(options);
  }
  async fetchDiscoveredJobs(command: JobsDiscoveryParamsCommand) {
    const jobsDiscoveryParamsData = this.mapper.map(
      command.data,
      JobsDiscoveryParams,
      JobsDiscoveryParamsData,
    );
    const reducedParams = this.toCleanObjParams(jobsDiscoveryParamsData);
    // Clean the object to remove undefined or null fields
    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${command.exchangeOracleUrl}/job`,
      params: reducedParams,
      headers: {
        Authorization: command.token,
        Accept: 'application/json',
      },
    };
    return this.callExternalHttpUtilRequest<JobsDiscoveryResponse>(options);
  }
}
