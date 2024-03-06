import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { ReputationOracleModule } from '../../integrations/reputation-oracle/reputation-oracle.module';
import { WorkerProfile } from './worker.mapper';
import { TokenMiddleware } from '../../common/interceptors/auth-token.middleware';
import { WorkerController } from './worker.controller';

@Module({
  imports: [ReputationOracleModule],
  providers: [WorkerService, WorkerProfile],
  exports: [WorkerService],
})
export class WorkerModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TokenMiddleware).forRoutes(WorkerController);
  }
}