import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JobsDiscoveryService } from './jobs-discovery.service';
import { JobsDiscoveryProfile } from './jobs-discovery.mapper';
import { HttpModule } from '@nestjs/axios';
import { TokenMiddleware } from '../../common/interceptors/auth-token.middleware';
import { JobsDiscoveryController } from './jobs-discovery.controller';
import { RequestContext } from '../../common/utils/request-context.util';

@Module({
  imports: [HttpModule],
  providers: [JobsDiscoveryService, JobsDiscoveryProfile, RequestContext],
  exports: [JobsDiscoveryService],
})
export class JobsDiscoveryModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TokenMiddleware).forRoutes(JobsDiscoveryController);
  }
}
