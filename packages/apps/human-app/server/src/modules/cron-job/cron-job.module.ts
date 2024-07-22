import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { ExchangeOracleModule } from '../../integrations/exchange-oracle/exchange-oracle.module';
import { CronJobService } from './cron-job.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CacheModule.register(),
    ExchangeOracleModule,
  ],
  providers: [CronJobService],
  exports: [CronJobService],
})
export class CronJobModule {}
