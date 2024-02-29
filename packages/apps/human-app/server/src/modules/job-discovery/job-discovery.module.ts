import { Module } from '@nestjs/common';
import { ReputationOracleModule } from '../../integrations/reputation-oracle/reputation-oracle.module';
import { OperatorService } from '../user-operator/operator.service';
import { OperatorProfile } from '../user-operator/operator.mapper';
import { JobDiscoveryController } from './job-discovery.controller';
import { JobDiscoveryService } from './job-discovery.serivce';
import { JobDiscoveryProfile } from './job-discovery.mapper';

@Module({
  controllers: [JobDiscoveryController],
  providers: [JobDiscoveryService, JobDiscoveryProfile],
  exports: [JobDiscoveryController, JobDiscoveryService],
})
export class JobDiscoveryModule {}
