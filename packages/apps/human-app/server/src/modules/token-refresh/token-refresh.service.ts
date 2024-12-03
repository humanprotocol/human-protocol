import { Injectable } from '@nestjs/common';
import { ReputationOracleGateway } from '../../integrations/reputation-oracle/reputation-oracle.gateway';
import { TokenRefreshCommand } from './model/token-refresh.model';

@Injectable()
export class TokenRefreshService {
  constructor(private gateway: ReputationOracleGateway) {}

  async refreshToken(command: TokenRefreshCommand) {
    return this.gateway.sendRefreshToken(command);
  }
}
