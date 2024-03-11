import { Injectable } from '@nestjs/common';
import {
  JobsFetchParamsCommand,
  JobAssignmentResponse,
  JobAssignmentCommand,
  JobsFetchResponse,
} from './interfaces/job-assignment.interface';
import { ExternalApiGateway } from '../../integrations/external-api/external-api.gateway';
@Injectable()
export class JobAssignmentService {
  constructor(private readonly externalApiGateway: ExternalApiGateway) {}

  async processJobAssignment(
    command: JobAssignmentCommand,
  ): Promise<JobAssignmentResponse> {
    return this.externalApiGateway.postNewJobAssignment(command);
  }

  async processGetAssignedJobs(
    command: JobsFetchParamsCommand,
  ): Promise<JobsFetchResponse> {
    return this.externalApiGateway.fetchAssignedJobs(command);
  }
}
