import { Module, Global } from '@nestjs/common';
import { AxiosRequestInterceptor } from './axios-request.interceptor';

@Global()
@Module({
  providers: [AxiosRequestInterceptor],
  exports: [AxiosRequestInterceptor],
})
export class InterceptorModule {}
