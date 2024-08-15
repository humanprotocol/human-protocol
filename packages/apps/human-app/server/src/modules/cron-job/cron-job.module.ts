import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ExchangeOracleModule } from '../../integrations/exchange-oracle/exchange-oracle.module';
import { CronJobService } from './cron-job.service';
import { OracleDiscoveryModule } from '../oracle-discovery/oracle-discovery.module';
import { WorkerModule } from '../user-worker/worker.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ExchangeOracleModule,
    OracleDiscoveryModule,
    WorkerModule,
  ],
  providers: [CronJobService],
  exports: [CronJobService],
})
export class CronJobModule {}
