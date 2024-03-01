import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
    url: string,
    jobsDiscoveryParamsCommand: JobsDiscoveryParamsCommand,
  ): Promise<JobsDiscoveryResponse> {
    const jobsDiscoveryParamsData = this.mapper.map(
      jobsDiscoveryParamsCommand,
      JobsDiscoveryParamsCommand,
      JobsDiscoveryParamsData,
    );
    try {
      const options = {
        method: 'GET',
        url: `${url}/jobs`,
        params: jobsDiscoveryParamsData,
      };
      const response = await lastValueFrom(this.httpService.request(options));
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new HttpException(error.response.data, error.response.status);
      } else {
        throw new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
