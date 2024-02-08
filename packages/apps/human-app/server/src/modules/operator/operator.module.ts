import { Module } from '@nestjs/common';
import { OperatorService } from './operator.service';
import { IntegrationsModule } from '../../integrations/integrations.module';
import { OperatorProfile } from './operator.mapper';

@Module({
  imports: [IntegrationsModule],
  providers: [OperatorService, OperatorProfile],
  exports: [OperatorService],
})
export class OperatorModule {}
