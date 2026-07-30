import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { lastValueFrom } from 'rxjs';
import { HttpMethod } from '../../common/enums/http-method';
import * as errorUtils from '../../common/utils/error';
import { toCleanObjParams } from '../../common/utils/gateway-common.utils';
import logger from '../../logger';
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
  OracleStatisticsCommand,
  OracleStatisticsResponse,
} from '../../modules/statistics/model/oracle-statistics.model';
import {
  UserStatisticsCommand,
  UserStatisticsResponse,
} from '../../modules/statistics/model/user-statistics.model';
import {
  RegistrationInExchangeOracleCommand,
  RegistrationInExchangeOracleData,
} from '../../modules/user-worker/model/worker-registration.model';
import { EscrowUtilsGateway } from '../escrow/escrow-utils-gateway.service';
import { KvStoreGateway } from '../kv-store/kv-store.gateway';
import {
  FetchJobsCommand,
  FetchJobsParams,
  FetchJobsParamsData,
  FetchJobsResponse,
} from './model/exchange-oracle.model';

@Injectable()
export class ExchangeOracleGateway {
  private readonly logger = logger.child({
    context: ExchangeOracleGateway.name,
  });

  constructor(
    private readonly httpService: HttpService,
    private readonly kvStoreGateway: KvStoreGateway,
    private readonly escrowUtilsGateway: EscrowUtilsGateway,
    @InjectMapper() private mapper: Mapper,
  ) {}

  private async callExternalHttpUtilRequest<T>(
    options: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response = await lastValueFrom(this.httpService.request(options));
      return response.data as T;
    } catch (error) {
      if (
        error instanceof AxiosError &&
        error.response?.status &&
        error.response.status >= 500
      ) {
        this.logger.error('Error while executing exchange oracle API call', {
          url: options.url,
          method: options.method,
          data: options.data,
          error: errorUtils.formatError(error),
        });
      }
      throw error;
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

  async fetchJobs(command: FetchJobsCommand): Promise<FetchJobsResponse> {
    const fetchJobsParamsData = this.mapper.map(
      command.data,
      FetchJobsParams,
      FetchJobsParamsData,
    );
    const reducedParams = toCleanObjParams(fetchJobsParamsData);
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
    return this.callExternalHttpUtilRequest<FetchJobsResponse>(options);
  }

  async sendRegistrationInExchangeOracle(
    command: RegistrationInExchangeOracleCommand,
  ) {
    const data = this.mapper.map(
      command,
      RegistrationInExchangeOracleCommand,
      RegistrationInExchangeOracleData,
    );

    const options: AxiosRequestConfig = {
      method: HttpMethod.POST,
      url: `${await this.kvStoreGateway.getExchangeOracleUrlByAddress(
        command.oracleAddress,
      )}/register`,
      data: data,
      headers: {
        Authorization: command.token,
        Accept: 'application/json',
      },
    };
    return this.callExternalHttpUtilRequest(options);
  }
}
