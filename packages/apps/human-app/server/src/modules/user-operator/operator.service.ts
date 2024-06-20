import { Injectable } from '@nestjs/common';
import {
  SigninOperatorCommand,
  SignupOperatorCommand,
} from './model/operator.model';
import { ReputationOracleGateway } from '../../integrations/reputation-oracle/reputation-oracle.gateway';

@Injectable()
export class OperatorService {
  constructor(private gateway: ReputationOracleGateway) {}

  signupOperator(command: SignupOperatorCommand) {
    return this.gateway.sendOperatorSignup(command);
  }

  signinOperator(command: SigninOperatorCommand) {
    return this.gateway.sendOperatorSignin(command);
  }
}
