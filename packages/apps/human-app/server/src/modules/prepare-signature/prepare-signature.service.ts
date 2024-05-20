import { Injectable } from '@nestjs/common';
import { ReputationOracleGateway } from '../../integrations/reputation-oracle/reputation-oracle.gateway';
import {
  PrepareSignatureCommand,
  PrepareSignatureResponse,
} from './model/prepare-signature.model';

@Injectable()
export class PrepareSignatureService {
  constructor(private gateway: ReputationOracleGateway) {}

  async processPrepareSignature(
    command: PrepareSignatureCommand,
  ): Promise<PrepareSignatureResponse> {
    return this.gateway.sendPrepareSignature(command);
  }
}
