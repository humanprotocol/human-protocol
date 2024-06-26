import { Module } from '@nestjs/common';
import { OracleDiscoveryService } from './oracle-discovery.service';

@Module({
  providers: [OracleDiscoveryService],
  exports: [OracleDiscoveryService],
})
export class OracleDiscoveryModule {}
