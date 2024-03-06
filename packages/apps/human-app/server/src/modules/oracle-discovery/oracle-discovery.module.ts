import { Module } from '@nestjs/common';
import { OracleDiscoveryController } from './oracle-discovery.controller';
import { OracleDiscoveryService } from './oracle-discovery.serivce';
import { OracleDiscoveryProfile } from './oracle-discovery.mapper';

@Module({
  controllers: [OracleDiscoveryController],
  providers: [OracleDiscoveryService, OracleDiscoveryProfile],
  exports: [OracleDiscoveryService],
})
export class OracleDiscoveryModule {}
