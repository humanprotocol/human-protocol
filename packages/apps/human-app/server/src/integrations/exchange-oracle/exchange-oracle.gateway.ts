import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { lastValueFrom } from 'rxjs';
import {
  UserStatisticsCommand,
  UserStatisticsResponse,
} from '../../modules/statistics/model/user-statistics.model';
import { HttpService } from '@nestjs/axios';
import {
  OracleStatisticsCommand,
  OracleStatisticsResponse,
} from '../../modules/statistics/model/oracle-statistics.model';
import {
  JobAssignmentCommand,
  JobAssignmentData,
  JobAssignmentParams,
  JobAssignmentResponse,
  JobsFetchParams,
  JobsFetchParamsCommand,
  JobsFetchParamsData,
  JobsFetchResponse,
  ResignJobCommand,
  ResignJobData,
} from '../../modules/job-assignment/model/job-assignment.model';
import {
  JobsDiscoveryParams,
  JobsDiscoveryParamsCommand,
  JobsDiscoveryParamsData,
  JobsDiscoveryResponse,
} from '../../modules/jobs-discovery/model/jobs-discovery.model';
import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { HttpMethod } from '../../common/enums/http-method';
import { toCleanObjParams } from '../../common/utils/gateway-common.utils';
import { KvStoreGateway } from '../kv-store/kv-store.gateway';
import { EscrowUtilsGateway } from '../escrow/escrow-utils-gateway.service';

@Injectable()
export class ExchangeOracleGateway {
  constructor(
    private httpService: HttpService,
    private kvStoreGateway: KvStoreGateway,
    private readonly escrowUtilsGateway: EscrowUtilsGateway,
    @InjectMapper() private mapper: Mapper,
  ) {}
  private async callExternalHttpUtilRequest<T>(
    options: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response = await lastValueFrom(this.httpService.request(options));
      return response.data;
    } catch (e) {
      console.error(
        `Error, while executing exchange oracle API call with options: ${JSON.stringify(options)}, error details: ${e}`,
      );
      throw new InternalServerErrorException();
    }
  }

  async fetchUserStatistics(
    command: UserStatisticsCommand,
  ): Promise<UserStatisticsResponse> {
    const options: AxiosRequestConfig = {
      method: HttpMethod.GET,
      url: `${await this.kvStoreGateway.getExchangeOracleUrlByAddress(
        command.oracleAddress,
      )}/stats/assignment`,
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
      method: HttpMethod.GET,
      url: `${await this.kvStoreGateway.getExchangeOracleUrlByAddress(
        command.oracleAddress,
      )}/stats`,
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
    const reducedParams = toCleanObjParams(jobFetchParamsData);
    const options: AxiosRequestConfig = {
      method: HttpMethod.GET,
      url: `${await this.kvStoreGateway.getExchangeOracleUrlByAddress(
        command.oracleAddress,
      )}/assignment`,
      params: reducedParams,
      headers: {
        Authorization: command.token,
        Accept: 'application/json',
      },
    };
    return this.callExternalHttpUtilRequest<JobsFetchResponse>(options);
  }

  async postNewJobAssignment(
    command: JobAssignmentCommand,
  ): Promise<JobAssignmentResponse> {
    const exchangeOracleAddress =
      await this.escrowUtilsGateway.getExchangeOracleAddressByEscrowAddress(
        command.data.chainId,
        command.data.escrowAddress,
      );
    const url = await this.kvStoreGateway.getExchangeOracleUrlByAddress(
      exchangeOracleAddress,
    );
    const options: AxiosRequestConfig = {
      method: HttpMethod.POST,
      url: `${url}/assignment`,
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

  async resignAssignedJob(command: ResignJobCommand) {
    const data = this.mapper.map(command, ResignJobCommand, ResignJobData);
    const options: AxiosRequestConfig = {
      method: HttpMethod.POST,
      url: `${await this.kvStoreGateway.getExchangeOracleUrlByAddress(
        command.oracleAddress,
      )}/assignment/resign`,
      data: data,
      headers: {
        Authorization: command.token,
        Accept: 'application/json',
      },
    };
    return this.callExternalHttpUtilRequest(options);
  }

  async fetchJobs(command: JobsDiscoveryParamsCommand) {
    const jobsDiscoveryParamsData = this.mapper.map(
      command.data,
      JobsDiscoveryParams,
      JobsDiscoveryParamsData,
    );
    const reducedParams = toCleanObjParams(jobsDiscoveryParamsData);
    const options: AxiosRequestConfig = {
      method: HttpMethod.GET,
      url: `${await this.kvStoreGateway.getExchangeOracleUrlByAddress(
        command.oracleAddress,
      )}/job`,
      params: reducedParams,
      headers: {
        Authorization: command.token,
        Accept: 'application/json',
      },
    };
    return this.callExternalHttpUtilRequest<JobsDiscoveryResponse>(options);
  }
}
