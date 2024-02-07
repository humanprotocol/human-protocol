import { Injectable } from '@nestjs/common';
import { SignupOperatorCommand } from "./interfaces/operator-registration.interface";
import { ReputationOracleGateway } from "../../integrations/reputation-oracle/reputation-oracle.gateway";

@Injectable()
export class OperatorService {
  constructor(private reputationOracleGateway: ReputationOracleGateway) {}
  registerOperator(command: SignupOperatorCommand): Promise<void> {
    return this.reputationOracleGateway.sendOperatorSignup(command);
  }
}
