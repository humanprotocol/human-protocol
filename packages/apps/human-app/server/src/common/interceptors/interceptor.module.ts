import { Module, Global } from '@nestjs/common';
import { AxiosRequestInterceptor } from './axios-request.interceptor';
import { EnvironmentConfigService } from '../config/environment-config.service';
import { TransformEnumInterceptor } from './transform-enum.interceptor';

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
      provide: TransformEnumInterceptor, // Add the new interceptor
      useFactory: () => {
        return new TransformEnumInterceptor();
      },
    },
  ],
  exports: [AxiosRequestInterceptor, TransformEnumInterceptor],
})
export class InterceptorModule {}
