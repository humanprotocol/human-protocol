import { Injectable } from '@nestjs/common';

import { ReputationOracleGateway } from '../../integrations/reputation-oracle/reputation-oracle.gateway';

import { SigninOperatorCommand } from './model/operator-signin.model';
import { SignupOperatorCommand } from './model/operator-registration.model';
import { DisableOperatorCommand } from './model/disable-operator.model';
import { EnableOperatorCommand } from './model/enable-operator.model';

@Injectable()
export class OperatorService {
  constructor(private gateway: ReputationOracleGateway) {}

  signupOperator(command: SignupOperatorCommand) {
    return this.gateway.sendOperatorSignup(command);
  }

  signinOperator(command: SigninOperatorCommand) {
    return this.gateway.sendOperatorSignin(command);
  }

  async disableOperator(command: DisableOperatorCommand): Promise<void> {
    await this.gateway.sendDisableOperator(command);
  }

  async enableOperator(command: EnableOperatorCommand): Promise<void> {
    await this.gateway.sendEnableOperator(command);
  }
}
