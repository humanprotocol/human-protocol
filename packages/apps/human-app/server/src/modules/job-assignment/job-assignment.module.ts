import { Module } from '@nestjs/common';
import { JobAssignmentService } from './job-assignment.service';
import { JobAssignmentProfile } from './job-assignment.mapper';
import { CommonUtilModule } from '../../common/utils/common-util.module';

@Module({
  imports: [CommonUtilModule],
  providers: [JobAssignmentService, JobAssignmentProfile],
  exports: [JobAssignmentService],
})
export class JobAssignmentModule {}
