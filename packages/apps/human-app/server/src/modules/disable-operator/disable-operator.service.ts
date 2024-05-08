import { Injectable } from '@nestjs/common';
import { ReputationOracleGateway } from '../../integrations/reputation-oracle/reputation-oracle.gateway';
import { DisableOperatorCommand } from './model/disable-operator.model';

@Injectable()
export class DisableOperatorService {
  constructor(private gateway: ReputationOracleGateway) {}

  async processDisableOperator(command: DisableOperatorCommand): Promise<void> {
    return this.gateway.sendDisableOperator(command);
  }
}
