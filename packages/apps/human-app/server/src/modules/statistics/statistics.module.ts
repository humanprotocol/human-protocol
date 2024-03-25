import { StatisticsService } from './statistics.service';
import { Module } from '@nestjs/common';
import { ExchangeOracleModule } from '../../integrations/exchange-oracle/exchange-oracle.module';

@Module({
  imports: [ExchangeOracleModule],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
