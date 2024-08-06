import { StatisticsService } from './statistics.service';
import { Module } from '@nestjs/common';
import { ExchangeOracleModule } from '../../integrations/exchange-oracle/exchange-oracle.module';
import { StatisticsProfile } from './statistics.mapper.profile';

@Module({
  imports: [ExchangeOracleModule],
  providers: [StatisticsService, StatisticsProfile],
  exports: [StatisticsService],
})
export class StatisticsModule {}
