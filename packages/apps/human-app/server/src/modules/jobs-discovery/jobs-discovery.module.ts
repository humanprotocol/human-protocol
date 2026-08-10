import { Module } from '@nestjs/common';
import { ExchangeOracleModule } from '../../integrations/exchange-oracle/exchange-oracle.module';
import { JobsDiscoveryProfile } from './jobs-discovery.mapper.profile';
import { JobsDiscoveryService } from './jobs-discovery.service';

@Module({
  imports: [ExchangeOracleModule],
  providers: [JobsDiscoveryService, JobsDiscoveryProfile],
  exports: [JobsDiscoveryService],
})
export class JobsDiscoveryModule {}
