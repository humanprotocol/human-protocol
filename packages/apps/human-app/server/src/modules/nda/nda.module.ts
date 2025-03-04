import { Module } from '@nestjs/common';
import { NDAService } from 'src/modules/nda/nda.service';
import { ReputationOracleModule } from '../../integrations/reputation-oracle/reputation-oracle.module';
import { SignNDAProfile } from './nda.mapper.profile';

@Module({
  imports: [ReputationOracleModule],
  providers: [NDAService, SignNDAProfile],
  exports: [NDAService],
})
export class NDAModule {}
