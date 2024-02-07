import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { IntegrationsModule } from '../../integrations/integrations.module';
import { WorkerProfile } from './worker.mapper';

@Module({
  imports: [IntegrationsModule],
  providers: [WorkerService, WorkerProfile],
  exports: [WorkerService],
})
export class WorkerModule {}
