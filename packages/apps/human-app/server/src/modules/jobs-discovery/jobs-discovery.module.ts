import { Module } from '@nestjs/common';
import { JobsDiscoveryService } from './jobs-discovery.service';
import { JobsDiscoveryProfile } from './jobs-discovery.mapper';
import { CommonUtilModule } from '../../common/utils/common-util.module';

@Module({
  imports: [CommonUtilModule],
  providers: [JobsDiscoveryService, JobsDiscoveryProfile],
  exports: [JobsDiscoveryService],
})
export class JobsDiscoveryModule {}
