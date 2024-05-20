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
import { EscrowUtilsGateway } from '../../integrations/escrow/escrow-utils-gateway.service';
@Injectable()
export class JobAssignmentService {
  constructor(
    private readonly kvStoreGateway: KvStoreGateway,
    private readonly exchangeOracleGateway: ExchangeOracleGateway,
    private readonly escrowUtilsGateway: EscrowUtilsGateway,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  async processJobAssignment(
    command: JobAssignmentCommand,
  ): Promise<JobAssignmentResponse> {
    const exchangeOracleAddress =
      await this.escrowUtilsGateway.getExchangeOracleAddressByEscrowAddress(
        command.data.chainId,
        command.data.escrowAddress,
      );
    const exchangeOracleUrl =
      await this.kvStoreGateway.getExchangeOracleUrlByAddress(
        exchangeOracleAddress,
      );
    const details = this.mapper.map(
      command,
      JobAssignmentCommand,
      JobAssignmentDetails,
    );
    details.exchangeOracleUrl = exchangeOracleUrl;
    return this.exchangeOracleGateway.postNewJobAssignment(details);
  }

  async processGetAssignedJobs(
    command: JobsFetchParamsCommand,
  ): Promise<JobsFetchResponse> {
    const exchangeOracleUrl =
      await this.kvStoreGateway.getExchangeOracleUrlByAddress(command.address);
    const details = this.mapper.map(
      command,
      JobsFetchParamsCommand,
      JobsFetchParamsDetails,
    );
    details.exchangeOracleUrl = exchangeOracleUrl;
    return this.exchangeOracleGateway.fetchAssignedJobs(details);
  }
}
