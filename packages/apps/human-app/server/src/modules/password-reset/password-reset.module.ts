import { Module } from '@nestjs/common';
import { PasswordResetController } from './password-reset.controller';
import { PasswordResetService } from './password-reset.service';
import { ReputationOracleModule } from '../../integrations/reputation-oracle/reputation-oracle.module';
import { PasswordResetProfile } from './password-reset.mapper';

@Module({
  imports: [ReputationOracleModule],
  controllers: [PasswordResetController],
  providers: [PasswordResetService, PasswordResetProfile],
})
export class PasswordResetModule {}
