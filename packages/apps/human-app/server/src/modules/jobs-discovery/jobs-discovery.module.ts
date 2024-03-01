import { Module } from '@nestjs/common';
import { JobsDiscoveryService } from './jobs-discovery.service';
import { JobsDiscoveryProfile } from './jobs-discovery.mapper';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [JobsDiscoveryService, JobsDiscoveryProfile],
  exports: [JobsDiscoveryService],
})
export class JobsDiscoveryModule {}
