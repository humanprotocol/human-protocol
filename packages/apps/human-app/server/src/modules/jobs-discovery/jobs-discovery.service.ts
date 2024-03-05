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

@Injectable()
export class JobsDiscoveryService {
  constructor(
    public httpService: HttpService,
    @InjectMapper() private readonly mapper: Mapper,
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
      const options = {
        method: 'GET',
        url: `${url}/jobs`,
        params: jobsDiscoveryParamsData,
      };
      const response = await lastValueFrom(this.httpService.request(options));
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}
