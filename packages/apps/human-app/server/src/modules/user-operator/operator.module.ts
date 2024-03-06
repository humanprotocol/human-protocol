import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { OperatorService } from './operator.service';
import { ReputationOracleModule } from '../../integrations/reputation-oracle/reputation-oracle.module';
import { OperatorProfile } from './operator.mapper';
import { TokenMiddleware } from '../../common/interceptors/auth-token.middleware';
import { OperatorController } from './operator.controller';

@Module({
  imports: [ReputationOracleModule],
  providers: [OperatorService, OperatorProfile],
  exports: [OperatorService],
})
export class OperatorModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TokenMiddleware).forRoutes(OperatorController);
  }
}