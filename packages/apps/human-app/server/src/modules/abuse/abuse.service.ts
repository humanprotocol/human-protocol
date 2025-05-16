import { Injectable } from '@nestjs/common';
import { ReputationOracleGateway } from '../../integrations/reputation-oracle/reputation-oracle.gateway';
import { ReportAbuseCommand } from './model/abuse.model';

@Injectable()
export class AbuseService {
  constructor(private gateway: ReputationOracleGateway) {}

  async reportAbuse(command: ReportAbuseCommand): Promise<void> {
    return this.gateway.sendAbuseReport(command);
  }

  async getUserAbuseReports(token: string) {
    return this.gateway.getAbuseReports(token);
  }
}
