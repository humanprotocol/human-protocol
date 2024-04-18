import { Injectable } from '@nestjs/common';
import {
  JobsFetchParamsCommand,
  JobAssignmentResponse,
  JobAssignmentCommand,
  JobsFetchResponse,
} from './model/job-assignment.model';
import { ExchangeOracleGateway } from '../../integrations/exchange-oracle/exchange-oracle.gateway';
@Injectable()
export class JobAssignmentService {
  constructor(private readonly gateway: ExchangeOracleGateway) {}

  async processJobAssignment(
    command: JobAssignmentCommand,
  ): Promise<JobAssignmentResponse> {
    return this.gateway.postNewJobAssignment(command);
  }

  async processGetAssignedJobs(
    command: JobsFetchParamsCommand,
  ): Promise<JobsFetchResponse> {
    return this.gateway.fetchAssignedJobs(command);
  }
}
