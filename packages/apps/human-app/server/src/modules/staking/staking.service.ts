import { Injectable } from '@nestjs/common';
import { ReputationOracleGateway } from '../../integrations/reputation-oracle/reputation-oracle.gateway';
import {
  StakeConfigResponse,
  StakeSummaryResponse,
} from './model/staking.model';

@Injectable()
export class StakingService {
  constructor(private readonly reputationOracle: ReputationOracleGateway) {}

  getStakeSummary(token: string): Promise<StakeSummaryResponse> {
    return this.reputationOracle.getStakeSummary(token);
  }

  getStakeConfig(token: string): Promise<StakeConfigResponse> {
    return this.reputationOracle.getStakeConfig(token);
  }
}
