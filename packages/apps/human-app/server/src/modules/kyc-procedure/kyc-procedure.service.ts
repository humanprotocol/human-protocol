import { Injectable } from '@nestjs/common';
import { ReputationOracleGateway } from '../../integrations/reputation-oracle/reputation-oracle.gateway';
import { KycProcedureStartResponse } from './model/kyc-start.model';

@Injectable()
export class KycProcedureService {
  constructor(private reputationOracleService: ReputationOracleGateway) {}

  async processStartKycProcedure(): Promise<KycProcedureStartResponse> {
    return this.reputationOracleService.sendKycProcedureStart();
  }
}
