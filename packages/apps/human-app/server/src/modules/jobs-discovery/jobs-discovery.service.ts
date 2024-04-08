import { Injectable } from '@nestjs/common';
import {
  JobsDiscoveryParamsCommand,
  JobsDiscoveryResponse,
} from './model/jobs-discovery.model';
import { ExchangeOracleGateway } from '../../integrations/exchange-oracle/exchange-oracle.gateway';
@Injectable()
export class JobsDiscoveryService {
  constructor(private readonly gateway: ExchangeOracleGateway) {}

  async processJobsDiscovery(
    command: JobsDiscoveryParamsCommand,
  ): Promise<JobsDiscoveryResponse> {
    return this.gateway.fetchDiscoveredJobs(command);
  }
}
