import { Module } from '@nestjs/common';
import { OracleDiscoveryService } from './oracle-discovery.service';
import { OracleDiscoveryProfile } from './oracle-discovery.mapper.profile';
import { KvStoreModule } from '../../integrations/kv-store/kv-store.module';
import { JobsDiscoveryModule } from '../jobs-discovery/jobs-discovery.module';

@Module({
  imports: [JobsDiscoveryModule, KvStoreModule],
  providers: [OracleDiscoveryService, OracleDiscoveryProfile],
  exports: [OracleDiscoveryService],
})
export class OracleDiscoveryModule {}
