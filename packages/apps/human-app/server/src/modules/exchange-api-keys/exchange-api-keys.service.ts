import { Injectable } from '@nestjs/common';
import { ReputationOracleGateway } from '../../integrations/reputation-oracle/reputation-oracle.gateway';
import {
  EnrollExchangeApiKeysCommand,
  StakeSummaryResponse,
  RetrieveExchangeApiKeysResponse,
} from './model/exchange-api-keys.model';

@Injectable()
export class ExchangeApiKeysService {
  constructor(private readonly reputationOracle: ReputationOracleGateway) {}

  enroll(command: EnrollExchangeApiKeysCommand): Promise<{ id: number }> {
    return this.reputationOracle.enrollExchangeApiKeys(command);
  }

  delete(token: string): Promise<void> {
    return this.reputationOracle.deleteExchangeApiKeys(token);
  }

  retrieve(token: string): Promise<RetrieveExchangeApiKeysResponse> {
    return this.reputationOracle.retrieveExchangeApiKeys(token);
  }

  getStakeSummary(token: string): Promise<StakeSummaryResponse> {
    return this.reputationOracle.getStakeSummary(token);
  }

  getSupportedExchanges(token: string): Promise<string[]> {
    return this.reputationOracle.supportedExchanges(token);
  }
}
