import { Module } from '@nestjs/common';
import { ReputationOracleModule } from '../../integrations/reputation-oracle/reputation-oracle.module';
import { SignNDAProfile } from './nda.mapper.profile';
import { NDAService } from './nda.service';

@Module({
  imports: [ReputationOracleModule],
  providers: [NDAService, SignNDAProfile],
  exports: [NDAService],
})
export class NDAModule {}
