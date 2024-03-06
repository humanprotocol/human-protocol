import { Injectable } from '@nestjs/common';
import {
  JobsFetchParamsCommand,
  JobsFetchParamsData,
  JobAssignmentResponse,
  JobAssignmentCommand,
  JobAssignmentData,
  JobsFetchResponse,
} from './interfaces/job-assignment.interface';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { RequestContext } from '../../common/utils/request-context.util';
import { CommonHttpUtilService } from '../../common/utils/common-http-util.service';

@Injectable()
export class JobAssignmentService {
  constructor(
    private readonly httpService: CommonHttpUtilService,
    @InjectMapper() private readonly mapper: Mapper,
    private readonly requestContext: RequestContext,
  ) {}

  async processJobAssignment(
    command: JobAssignmentCommand,
  ): Promise<JobAssignmentResponse> {
    const url = command.exchange_oracle_url;
    const data = this.mapper.map(
      command,
      JobAssignmentCommand,
      JobAssignmentData,
    );
    const token = this.requestContext.token;
    const options = {
      method: 'POST',
      url: `${url}/assignment`,
      data: data,
      headers: { Authorization: `Bearer ${token}`}
    };
    return await this.httpService.callExternalHttpUtilRequest<JobAssignmentResponse>(
      options,
    );
  }

  async processGetAssignedJobs(
    command: JobsFetchParamsCommand,
  ): Promise<JobsFetchResponse> {
    const url = command.exchange_oracle_url;
    const data = this.mapper.map(
      command,
      JobsFetchParamsCommand,
      JobsFetchParamsData,
    );
    const options = {
      method: 'GET',
      url: `${url}/assignment`,
      params: data,
    };
    return await this.httpService.callExternalHttpUtilRequest<JobsFetchResponse>(
      options,
    );
  }
}
