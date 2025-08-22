import { Module } from '@nestjs/common';
import { GovernanceService } from './governance.service';

@Module({
  providers: [GovernanceService],
  exports: [GovernanceService],
})
export class GovernanceModule {}
