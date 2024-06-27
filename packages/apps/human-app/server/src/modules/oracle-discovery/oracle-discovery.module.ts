import { Module } from '@nestjs/common';
import { OracleDiscoveryService } from './oracle-discovery.service';
import { OracleDiscoveryProfile } from './oracle-discovery.mapper.profile';

@Module({
  providers: [OracleDiscoveryService, OracleDiscoveryProfile],
  exports: [OracleDiscoveryService],
})
export class OracleDiscoveryModule {}
