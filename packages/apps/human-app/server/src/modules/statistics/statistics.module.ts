import { StatisticsService } from './statistics.service';
import { Module } from '@nestjs/common';
import { ExchangeOracleModule } from '../../integrations/exchange-oracle/exchange-oracle.module';
import { KvStoreModule } from '../../integrations/kv-store/kv-store.module';

@Module({
  imports: [ExchangeOracleModule, KvStoreModule],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
