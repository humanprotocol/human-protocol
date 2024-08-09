import { Injectable } from '@nestjs/common';
import { ReputationOracleGateway } from '../../integrations/reputation-oracle/reputation-oracle.gateway';
import { ExchangeOracleGateway } from '../../integrations/exchange-oracle/exchange-oracle.gateway';
import { RegisterWorkerCommand, SignupWorkerCommand } from './model/worker-registration.model';
import { SigninWorkerCommand } from './model/worker-signin.model';

@Injectable()
export class WorkerService {
  constructor(
    private exchangeOracleGateway: ExchangeOracleGateway,
    private reputationOracleGateway: ReputationOracleGateway
  ) {}

  async signupWorker(signupWorkerCommand: SignupWorkerCommand) {
    return this.reputationOracleGateway.sendWorkerSignup(signupWorkerCommand);
  }
  async signinWorker(signinWorkerCommand: SigninWorkerCommand) {
    return this.reputationOracleGateway.sendWorkerSignin(signinWorkerCommand);
  }
  async registerWorker(registerWorkerCommand: RegisterWorkerCommand) {
    await this.exchangeOracleGateway.registerWorker(registerWorkerCommand);

    return this.reputationOracleGateway.sendWorkerRegistration(registerWorkerCommand);
  }
}
