import { Module } from '@nestjs/common';
import { OperatorService } from './operator.service';
import { IntegrationsModule } from "../../integrations/integrations.module";

@Module({
  imports: [IntegrationsModule],
  providers: [OperatorService],
  exports: [OperatorService],
})
export class OperatorModule {}
