import { Module } from '@nestjs/common';
import { AuthWorkerService } from './auth-worker.service';
import { IntegrationsModule } from '../../integrations/integrations.module';
import { AuthWorkerProfile } from './auth-worker.mapper';

@Module({
  imports: [IntegrationsModule],
  providers: [AuthWorkerService, AuthWorkerProfile],
  exports: [AuthWorkerService],
})
export class AuthWorkerModule {}
