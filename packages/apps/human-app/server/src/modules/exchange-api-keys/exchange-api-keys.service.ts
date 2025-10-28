import { Injectable } from '@nestjs/common';
import { ReputationOracleGateway } from '../../integrations/reputation-oracle/reputation-oracle.gateway';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import {
  DeleteExchangeApiKeysCommand,
  EnrollExchangeApiKeysCommand,
  RetrieveExchangeApiKeysCommand,
  RetrieveExchangeApiKeysResponse,
} from './model/exchange-api-keys.model';

@Injectable()
export class ExchangeApiKeysService {
  constructor(
    private readonly reputationOracle: ReputationOracleGateway,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  enroll(command: EnrollExchangeApiKeysCommand): Promise<{ id: number }> {
    return this.reputationOracle.enrollExchangeApiKeys(command);
  }

  delete(command: DeleteExchangeApiKeysCommand): Promise<void> {
    return this.reputationOracle.deleteExchangeApiKeys(command.token);
  }

  retrieve(
    command: RetrieveExchangeApiKeysCommand,
  ): Promise<RetrieveExchangeApiKeysResponse> {
    return this.reputationOracle.retrieveExchangeApiKeys(command.token);
  }
}
