import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import {
  JobsFetchParamsCommand,
  JobsFetchParamsData,
  JobAssignmentResponse,
  JobAssignmentCommand,
  JobAssignmentData,
  JobsFetchResponse,
} from './interfaces/job-assignment.interface';
import { HttpService } from '@nestjs/axios';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { RequestContext } from '../../common/utils/request-context.util';

@Injectable()
export class JobAssignmentService {
  constructor(
    public httpService: HttpService,
    @InjectMapper() private readonly mapper: Mapper,
    private readonly requestContext: RequestContext,
  ) {}

  async processJobAssignment(
    jobAssignmentCommand: JobAssignmentCommand,
  ): Promise<JobAssignmentResponse> {
    const jobAssignmentData = this.mapper.map(
      jobAssignmentCommand,
      JobAssignmentCommand,
      JobAssignmentData,
    );
    try {
      const url = jobAssignmentData.exchange_oracle_url;
      const token = this.requestContext.token;
      const options = {
        method: 'POST',
        url: `${url}/assignment`,
        data: jobAssignmentData,
        headers: { Authorization: `Bearer ${token}` },
      };
      const response = await lastValueFrom(this.httpService.request(options));
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async processGetAssignedJobs(
    jobsAssignmentParamsCommand: JobsFetchParamsCommand,
  ): Promise<JobsFetchResponse> {
    const jobsAssignmentParamsData = this.mapper.map(
      jobsAssignmentParamsCommand,
      JobsFetchParamsCommand,
      JobsFetchParamsData,
    );
    try {
      const url = jobsAssignmentParamsData.exchange_oracle_url;
      const options = {
        method: 'GET',
        url: `${url}/assignment`,
        params: jobsAssignmentParamsData,
      };
      const response = await lastValueFrom(this.httpService.request(options));
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}
