import { JobsDiscoveryService } from './jobs-discovery.service';
import { JobsDiscoveryProfile } from './jobs-discovery.mapper.profile';
import { Module } from '@nestjs/common';
import { ExchangeOracleModule } from '../../integrations/exchange-oracle/exchange-oracle.module';

@Module({
  imports: [ExchangeOracleModule],
  providers: [JobsDiscoveryService, JobsDiscoveryProfile],
  exports: [JobsDiscoveryService],
})
export class JobsDiscoveryModule {}
