import { Injectable } from '@nestjs/common';
import {
  JobsDiscoveryParamsCommand,
  JobsDiscoveryParamsData,
  JobsDiscoveryResponse,
} from './interfaces/jobs-discovery.interface';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { CommonHttpUtilService } from '../../common/utils/common-http-util.service';
import { AxiosRequestConfig } from 'axios';
import { RequestContext } from '../../common/utils/request-context.util';

@Injectable()
export class JobsDiscoveryService {
  constructor(
    @InjectMapper() private readonly mapper: Mapper,
    private readonly httpService: CommonHttpUtilService,
    private readonly requestContext: RequestContext,
  ) {}

  async processJobsDiscovery(
    command: JobsDiscoveryParamsCommand,
  ): Promise<JobsDiscoveryResponse> {
    const url = command.exchange_oracle_url;
    const token = this.requestContext.token;
    const data = this.mapper.map(
      command,
      JobsDiscoveryParamsCommand,
      JobsDiscoveryParamsData,
    );
    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${url}/jobs`,
      params: data,
      headers: { Authorization: `Bearer ${token}` },
    };
    return this.httpService.callExternalHttpUtilRequest<JobsDiscoveryResponse>(
      options,
    );
  }
}
