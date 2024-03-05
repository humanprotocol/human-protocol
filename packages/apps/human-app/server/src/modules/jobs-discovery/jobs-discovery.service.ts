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
import { RequestContext } from '../../common/utils/request-context.util';

@Injectable()
export class JobsDiscoveryService {
  constructor(
    public httpService: HttpService,
    @InjectMapper() private readonly mapper: Mapper,
    private readonly requestContext: RequestContext,
  ) {}

  async processJobsDiscovery(
    jobsDiscoveryParamsCommand: JobsDiscoveryParamsCommand,
  ): Promise<JobsDiscoveryResponse> {
    const jobsDiscoveryParamsData = this.mapper.map(
      jobsDiscoveryParamsCommand,
      JobsDiscoveryParamsCommand,
      JobsDiscoveryParamsData,
    );
    try {
      const url = jobsDiscoveryParamsCommand.exchange_oracle_url;
      const token = this.requestContext.token;
      const options = {
        method: 'GET',
        url: `${url}/jobs`,
        params: jobsDiscoveryParamsData,
        headers: { Authorization: `Bearer ${token}` },
      };
      const response = await lastValueFrom(this.httpService.request(options));
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}
