import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ExchangeOracleModule } from '../../integrations/exchange-oracle/exchange-oracle.module';
import { ReputationOracleModule } from '../../integrations/reputation-oracle/reputation-oracle.module';
import { CronJobService } from './cron-job.service';
import { OracleDiscoveryModule } from '../oracle-discovery/oracle-discovery.module';
import { JobsDiscoveryModule } from '../jobs-discovery/jobs-discovery.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ExchangeOracleModule,
    ReputationOracleModule,
    OracleDiscoveryModule,
    JobsDiscoveryModule,
  ],
  providers: [CronJobService],
  exports: [CronJobService],
})
export class CronJobModule {}
