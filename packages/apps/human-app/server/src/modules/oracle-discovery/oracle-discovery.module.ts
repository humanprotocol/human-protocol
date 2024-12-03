import { Module } from '@nestjs/common';
import { OracleDiscoveryService } from './oracle-discovery.service';
import { OracleDiscoveryProfile } from './oracle-discovery.mapper.profile';
import { KvStoreModule } from '../../integrations/kv-store/kv-store.module';

@Module({
  imports: [KvStoreModule],
  providers: [OracleDiscoveryService, OracleDiscoveryProfile],
  exports: [OracleDiscoveryService],
})
export class OracleDiscoveryModule {}
