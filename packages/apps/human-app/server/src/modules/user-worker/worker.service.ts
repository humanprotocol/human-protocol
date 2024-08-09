import { Injectable } from '@nestjs/common';
import { ReputationOracleGateway } from '../../integrations/reputation-oracle/reputation-oracle.gateway';
import { ExchangeOracleGateway } from '../../integrations/exchange-oracle/exchange-oracle.gateway';
import {
  RegisterWorkerCommand,
  SignupWorkerCommand,
} from './model/worker-registration.model';
import { SigninWorkerCommand } from './model/worker-signin.model';
import { KvStoreGateway } from 'src/integrations/kv-store/kv-store.gateway';

@Injectable()
export class WorkerService {
  constructor(
    private exchangeOracleGateway: ExchangeOracleGateway,
    private reputationOracleGateway: ReputationOracleGateway,
    private kvStoreGateway: KvStoreGateway,
  ) {}

  async signupWorker(signupWorkerCommand: SignupWorkerCommand) {
    return this.reputationOracleGateway.sendWorkerSignup(signupWorkerCommand);
  }
  async signinWorker(signinWorkerCommand: SigninWorkerCommand) {
    return this.reputationOracleGateway.sendWorkerSignin(signinWorkerCommand);
  }
  async registerWorker(registerWorkerCommand: RegisterWorkerCommand) {
    const isRegistrationNeeded =
      await this.kvStoreGateway.getExchangeOracleRegistrationNeeded(
        registerWorkerCommand.oracleAddress,
      );

    if (!isRegistrationNeeded) {
      throw new Error('No registration needed');
    }

    await this.exchangeOracleGateway.registerWorker(registerWorkerCommand);

    return await this.reputationOracleGateway.sendWorkerRegistration(
      registerWorkerCommand,
    );
  }
}
