import { JobAssignmentService } from './job-assignment.service';
import { JobAssignmentProfile } from './job-assignment.mapper';
import { Module } from '@nestjs/common';
import { ExternalApiModule } from '../../integrations/external-api/external-api.module';

@Module({
  imports: [ExternalApiModule],
  providers: [JobAssignmentService, JobAssignmentProfile],
  exports: [JobAssignmentService],
})
export class JobAssignmentModule {}
