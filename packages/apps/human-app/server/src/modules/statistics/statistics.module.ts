import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { CommonUtilModule } from '../../common/utils/common-util.module';
import { TokenMiddleware } from '../../common/interceptors/auth-token.middleware';
import { JobsDiscoveryController } from '../jobs-discovery/jobs-discovery.controller';

@Module({
  imports: [CommonUtilModule],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TokenMiddleware).forRoutes(JobsDiscoveryController);
  }
}
