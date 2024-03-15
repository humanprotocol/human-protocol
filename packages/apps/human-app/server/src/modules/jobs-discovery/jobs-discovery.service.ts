import { Injectable } from '@nestjs/common';
import {
  JobsDiscoveryParamsCommand,
  JobsDiscoveryResponse,
} from './interfaces/jobs-discovery.interface';
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
