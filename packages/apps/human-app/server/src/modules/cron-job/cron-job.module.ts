import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ExchangeOracleModule } from '../../integrations/exchange-oracle/exchange-oracle.module';
import { CronJobService } from './cron-job.service';
import { OracleDiscoveryModule } from '../oracle-discovery/oracle-discovery.module';
import { WorkerModule } from '../user-worker/worker.module';
import { JobsDiscoveryModule } from '../jobs-discovery/jobs-discovery.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ExchangeOracleModule,
    OracleDiscoveryModule,
    JobsDiscoveryModule,
    WorkerModule,
  ],
  providers: [CronJobService],
  exports: [CronJobService],
})
export class CronJobModule {}
