import { Injectable } from '@nestjs/common';
import {
  JobsFetchParamsCommand,
  JobAssignmentResponse,
  JobAssignmentCommand,
  JobsFetchResponse,
  ResignJobCommand,
} from './model/job-assignment.model';
import { ExchangeOracleGateway } from '../../integrations/exchange-oracle/exchange-oracle.gateway';
@Injectable()
export class JobAssignmentService {
  constructor(
    private readonly exchangeOracleGateway: ExchangeOracleGateway,
  ) {}

  async processJobAssignment(
    command: JobAssignmentCommand,
  ): Promise<JobAssignmentResponse> {
    return this.exchangeOracleGateway.postNewJobAssignment(command);
  }

  async processGetAssignedJobs(
    command: JobsFetchParamsCommand,
  ): Promise<JobsFetchResponse> {
    return this.exchangeOracleGateway.fetchAssignedJobs(command);
  }

  async resignJob(command: ResignJobCommand) {
    return this.exchangeOracleGateway.resignAssignedJob(command);
  }
}
