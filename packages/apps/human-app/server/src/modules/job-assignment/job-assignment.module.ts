import { Module } from '@nestjs/common';
import { JobAssignmentService } from './job-assignment.service';
import { JobAssignmentProfile } from './job-assignment.mapper';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [JobAssignmentService, JobAssignmentProfile],
  exports: [JobAssignmentService],
})
export class JobAssignmentModule {}
