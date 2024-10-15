import { Module, Global } from '@nestjs/common';
import { AxiosRequestInterceptor } from './axios-request.interceptor';
import { EnvironmentConfigService } from '../config/environment-config.service';
import { TransformEnumInterceptor } from './transform-enum.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

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
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformEnumInterceptor,
    },
  ],
  exports: [AxiosRequestInterceptor],
})
export class InterceptorModule {}
