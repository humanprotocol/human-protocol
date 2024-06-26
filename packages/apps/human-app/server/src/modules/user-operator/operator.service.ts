import { Injectable } from '@nestjs/common';
import {
  SignupOperatorCommand,
} from './model/operator-registration.model';
import { ReputationOracleGateway } from '../../integrations/reputation-oracle/reputation-oracle.gateway';
import { SigninOperatorCommand } from './model/operator-signin.model';

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
