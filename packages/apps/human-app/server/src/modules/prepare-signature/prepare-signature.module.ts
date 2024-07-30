import { Module } from '@nestjs/common';
import { PrepareSignatureController } from './prepare-signature.controller';
import { PrepareSignatureService } from './prepare-signature.service';
import { ReputationOracleModule } from '../../integrations/reputation-oracle/reputation-oracle.module';
import { PrepareSignatureProfile } from './prepare-signature.mapper.profile';

@Module({
  imports: [ReputationOracleModule],
  controllers: [PrepareSignatureController],
  providers: [PrepareSignatureService, PrepareSignatureProfile],
})
export class PrepareSignatureModule {}
