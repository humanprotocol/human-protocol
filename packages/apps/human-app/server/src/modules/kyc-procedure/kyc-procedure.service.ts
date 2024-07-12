import { Injectable } from '@nestjs/common';
import { ReputationOracleGateway } from '../../integrations/reputation-oracle/reputation-oracle.gateway';
import { KycProcedureStartResponse } from './model/kyc-start.model';

@Injectable()
export class KycProcedureService {
  constructor(private gateway: ReputationOracleGateway) {}

  async processStartKycProcedure(
    token: string,
  ): Promise<KycProcedureStartResponse> {
    return this.gateway.sendKycProcedureStart(token);
  }
}
