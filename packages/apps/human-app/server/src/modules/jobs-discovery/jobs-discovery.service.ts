import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import {
  JobsDiscoveryParamsCommand,
  JobsDiscoveryParamsData,
  JobsDiscoveryResponse,
} from './interfaces/jobs-discovery.interface';
import { HttpService } from '@nestjs/axios';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { callExternalHttpRequest } from '../../utils/http-request-hander';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class JobsDiscoveryService {
  constructor(@InjectMapper() private readonly mapper: Mapper) {}

  async processJobsDiscovery(
    command: JobsDiscoveryParamsCommand,
  ): Promise<JobsDiscoveryResponse> {
    const url = command.exchange_oracle_url;
    const data = this.mapper.map(
      command,
      JobsDiscoveryParamsCommand,
      JobsDiscoveryParamsData,
    );
    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${url}/jobs`,
      params: data,
    };
    return callExternalHttpRequest<JobsDiscoveryResponse>(options)
  }
}
