import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import {
  JobsDiscoveryParamsCommand,
  JobsDiscoveryResponse,
} from './interfaces/jobs-discovery.interface';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class JobsDiscoveryService {
  constructor(private httpService: HttpService) {}

  async processJobsDiscovery(
    url: string,
    jobsDiscoveryParamsCommand: JobsDiscoveryParamsCommand,
  ): Promise<JobsDiscoveryResponse> {
    try {
      const options = {
        method: 'GET',
        url: `${url}/jobs`,
        params: jobsDiscoveryParamsCommand,
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
