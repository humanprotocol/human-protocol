import { Module, Global } from '@nestjs/common';
import { AxiosRequestInterceptor } from './axios-request.interceptor';
import { EnvironmentConfigService } from '../config/environment-config.service';

@Global()
@Module({
  providers: [
    {
      provide: AxiosRequestInterceptor,
      useFactory: (configService: EnvironmentConfigService) => {
        if (configService.axiosRequestLoggingEnabled) {
          return new AxiosRequestInterceptor();
        }
        return null;
      },
      inject: [EnvironmentConfigService],
    },
  ],
  exports: [AxiosRequestInterceptor],
})
export class InterceptorModule {}
