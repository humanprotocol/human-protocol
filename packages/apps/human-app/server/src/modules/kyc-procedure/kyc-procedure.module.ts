import { Module } from '@nestjs/common';
import { KycProcedureController } from './kyc-procedure.controller';
import { KycProcedureService } from './kyc-procedure.service';
import { ReputationOracleModule } from '../../integrations/reputation-oracle/reputation-oracle.module';

@Module({
  imports: [ReputationOracleModule],
  controllers: [KycProcedureController],
  providers: [KycProcedureService],
})
export class KycProcedureModule {}
