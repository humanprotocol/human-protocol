import { Injectable } from '@nestjs/common';
import {
  JobsDiscoveryParamsCommand,
  JobsDiscoveryParamsDetails,
  JobsDiscoveryResponse,
} from './model/jobs-discovery.model';
import { ExchangeOracleGateway } from '../../integrations/exchange-oracle/exchange-oracle.gateway';
import { KvStoreGateway } from '../../integrations/kv-store/kv-store-gateway.service';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
@Injectable()
export class JobsDiscoveryService {
  constructor(
    private readonly kvStoreGateway: KvStoreGateway,
    @InjectMapper() private mapper: Mapper,
    private readonly exchangeOracleGateway: ExchangeOracleGateway,
  ) {}

  async processJobsDiscovery(
    command: JobsDiscoveryParamsCommand,
  ): Promise<JobsDiscoveryResponse> {
    const exchangeOracleUrl =
      await this.kvStoreGateway.getExchangeOracleUrlByAddress(command.oracleAddress);
    const details = this.mapper.map(
      command,
      JobsDiscoveryParamsCommand,
      JobsDiscoveryParamsDetails,
    );
    details.exchangeOracleUrl = exchangeOracleUrl;
    return this.exchangeOracleGateway.fetchJobs(details);
  }
}
