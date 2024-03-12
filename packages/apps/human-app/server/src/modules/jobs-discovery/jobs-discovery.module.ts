import { JobsDiscoveryService } from './jobs-discovery.service';
import { JobsDiscoveryProfile } from './jobs-discovery.mapper';
import { Module } from '@nestjs/common';
import { ExternalApiModule } from '../../integrations/external-api/external-api.module';

@Module({
  imports: [ExternalApiModule],
  providers: [JobsDiscoveryService, JobsDiscoveryProfile],
  exports: [JobsDiscoveryService],
})
export class JobsDiscoveryModule {}
