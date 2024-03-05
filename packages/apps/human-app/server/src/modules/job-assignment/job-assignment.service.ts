import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import {
  JobsAssignmentParamsCommand,
  JobsAssignmentParamsData,
  JobAssignmentResponse,
  JobAssignmentCommand,
  JobAssignmentData,
  JobsAssignmentResponse,
} from './interfaces/job-assignment.interface';
import { HttpService } from '@nestjs/axios';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';

@Injectable()
export class JobAssignmentService {
  constructor(
    public httpService: HttpService,
    @InjectMapper() private readonly mapper: Mapper,
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
      const options = {
        method: 'POST',
        url: `${url}/assignment`,
        data: jobAssignmentData,
      };
      const response = await lastValueFrom(this.httpService.request(options));
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async processGetAssignedJobs(
    jobsAssignmentParamsCommand: JobsAssignmentParamsCommand,
  ): Promise<JobsAssignmentResponse> {
    const jobsAssignmentParamsData = this.mapper.map(
      jobsAssignmentParamsCommand,
      JobsAssignmentParamsCommand,
      JobsAssignmentParamsData,
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
