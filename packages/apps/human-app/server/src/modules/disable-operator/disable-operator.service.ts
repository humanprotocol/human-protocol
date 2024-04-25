import { Injectable } from '@nestjs/common';
import { ReputationOracleGateway } from '../../integrations/reputation-oracle/reputation-oracle.gateway';
import {
  PrepareSignatureCommand,
  PrepareSignatureResponse,
} from './model/prepare-signature.model';
import { DisableOperatorCommand } from './model/disable-operator.model';

@Injectable()
export class DisableOperatorService {
  constructor(private gateway: ReputationOracleGateway) {}

  async processPrepareSignature(
    command: PrepareSignatureCommand,
  ): Promise<PrepareSignatureResponse> {
    return this.gateway.sendPrepareSignature(command);
  }
  async processDisableOperator(command: DisableOperatorCommand): Promise<void> {
    return this.gateway.sendDisableOperator(command);
  }
}
