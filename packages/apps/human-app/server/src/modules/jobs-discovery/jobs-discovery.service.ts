import { Injectable } from '@nestjs/common';
import {
  JobsDiscoveryParamsCommand,
  JobsDiscoveryResponse,
} from './interfaces/jobs-discovery.interface';
import { ExternalApiGateway } from '../../integrations/external-api/external-api.gateway';
@Injectable()
export class JobsDiscoveryService {
  constructor(private readonly externalApiGateway: ExternalApiGateway) {}

  async processJobsDiscovery(
    command: JobsDiscoveryParamsCommand,
  ): Promise<JobsDiscoveryResponse> {
    return this.externalApiGateway.fetchDiscoveredJobs(command);
  }
}
