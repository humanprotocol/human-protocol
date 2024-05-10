import { Module } from '@nestjs/common';
import { OracleDiscoveryService } from './oracle-discovery.serivce';

@Module({
  providers: [OracleDiscoveryService],
  exports: [OracleDiscoveryService],
})
export class OracleDiscoveryModule {}
