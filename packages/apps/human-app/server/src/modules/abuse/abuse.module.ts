import { AbuseService } from './abuse.service';
import { AbuseProfile } from './abuse.mapper.profile';
import { Module } from '@nestjs/common';
import { ReputationOracleModule } from '../../integrations/reputation-oracle/reputation-oracle.module';

@Module({
  imports: [ReputationOracleModule],
  providers: [AbuseService, AbuseProfile],
  exports: [AbuseService],
})
export class AbuseModule {}
