import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { IntegrationsModule } from '../../integrations/integrations.module';
import { AuthWorkerProfile } from './worker.mapper';

@Module({
  imports: [IntegrationsModule],
  providers: [WorkerService, AuthWorkerProfile],
  exports: [WorkerService],
})
export class WorkerModule {}
