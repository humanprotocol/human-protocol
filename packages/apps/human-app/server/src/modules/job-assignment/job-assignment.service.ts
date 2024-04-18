import { Injectable } from '@nestjs/common';
import {
  JobsFetchParamsCommand,
  JobAssignmentResponse,
  JobAssignmentCommand,
  JobsFetchResponse,
  JobAssignmentDetails,
  JobsFetchParamsDetails,
} from './model/job-assignment.model';
import { ExchangeOracleGateway } from '../../integrations/exchange-oracle/exchange-oracle.gateway';
import { KvStoreGateway } from '../../integrations/kv-store/kv-store-gateway.service';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
@Injectable()
export class JobAssignmentService {
  constructor(
    private readonly kvstoreGateway: KvStoreGateway,
    private readonly exchangeOracleGateway: ExchangeOracleGateway,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  async processJobAssignment(
    command: JobAssignmentCommand,
  ): Promise<JobAssignmentResponse> {
    const details = this.mapper.map(
      command,
      JobAssignmentCommand,
      JobAssignmentDetails,
    );
    details.exchangeOracleUrl =
      await this.kvstoreGateway.getExchangeOracleUrlByAddress(command.address);
    return this.exchangeOracleGateway.postNewJobAssignment(details);
  }

  async processGetAssignedJobs(
    command: JobsFetchParamsCommand,
  ): Promise<JobsFetchResponse> {
    const details = this.mapper.map(
      command,
      JobsFetchParamsCommand,
      JobsFetchParamsDetails,
    );
    details.exchangeOracleUrl =
      await this.kvstoreGateway.getExchangeOracleUrlByAddress(command.address);
    return this.exchangeOracleGateway.fetchAssignedJobs(details);
  }
}
