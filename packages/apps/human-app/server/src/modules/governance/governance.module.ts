import { Module } from '@nestjs/common';
import { CommonConfigModule } from '../../common/config/common-config.module';
import { GovernanceService } from './governance.service';
import { GovernanceController } from './governance.controller';

@Module({
  imports: [CommonConfigModule],
  controllers: [GovernanceController],
  providers: [GovernanceService],
  exports: [GovernanceService],
})
export class GovernanceModule {}
