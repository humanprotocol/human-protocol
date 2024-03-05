import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JobAssignmentService } from './job-assignment.service';
import { JobAssignmentProfile } from './job-assignment.mapper';
import { HttpModule } from '@nestjs/axios';
import { TokenMiddleware } from '../../common/interceptors/auth-token.middleware';
import { JobAssignmentController } from './job-assignment.controller';
import { RequestContext } from '../../common/utils/request-context.util';

@Module({
  imports: [HttpModule],
  providers: [JobAssignmentService, JobAssignmentProfile, RequestContext],
  exports: [JobAssignmentService],
})
export class JobAssignmentModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TokenMiddleware).forRoutes(JobAssignmentController);
  }
}
