import { Module } from '@nestjs/common';
import { AuthWorkerService } from './auth-worker.service';
import { IntegrationsModule } from '../../integrations/integrations.module';

@Module({
  imports: [IntegrationsModule],
  providers: [AuthWorkerService],
  exports: [AuthWorkerService],
})
export class AuthWorkerModule {}
