import { Injectable } from '@nestjs/common';
import { SignupOperatorCommand } from './interfaces/operator-registration.interface';
import { ReputationOracleGateway } from '../../integrations/reputation-oracle/reputation-oracle.gateway';

@Injectable()
export class OperatorService {
  constructor(private reputationOracleGateway: ReputationOracleGateway) {}

  signupOperator(command: SignupOperatorCommand) {
    return this.reputationOracleGateway.sendOperatorSignup(command);
  }
}
