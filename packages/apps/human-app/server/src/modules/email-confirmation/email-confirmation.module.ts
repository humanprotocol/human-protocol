import { Module } from '@nestjs/common';
import { EmailConfirmationController } from './email-confirmation.controller';
import { EmailConfirmationService } from './email-confirmation.service';
import { ReputationOracleModule } from '../../integrations/reputation-oracle/reputation-oracle.module';
import { EmailConfirmationProfile } from './email-confirmation.mapper';

@Module({
  imports: [ReputationOracleModule],
  controllers: [EmailConfirmationController],
  providers: [EmailConfirmationService, EmailConfirmationProfile],
})
export class EmailConfirmationModule {}
