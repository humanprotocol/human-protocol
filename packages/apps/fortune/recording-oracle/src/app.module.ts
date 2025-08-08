import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { HttpValidationPipe } from './common/pipes';
import { JobModule } from './modules/job/job.module';

import { AppController } from './app.controller';
import { SnakeCaseInterceptor } from './common/interceptors/snake-case';
import { WebhookModule } from './modules/webhook/webhook.module';
import { envValidator } from './common/config/env-schema';
import { EnvConfigModule } from './common/config/config.module';
import { TransformEnumInterceptor } from './common/interceptors/transform-enum.interceptor';
import { ExceptionFilter } from './common/exceptions/exception.filter';
import Environment from './common/utils/environment';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: HttpValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: ExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SnakeCaseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformEnumInterceptor,
    },
  ],
  imports: [
    ConfigModule.forRoot({
      /**
       * First value found takes precendece
       */
      envFilePath: [`.env.${Environment.name}`, '.env.local', '.env'],
      validationSchema: envValidator,
    }),
    JobModule,
    WebhookModule,
    EnvConfigModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
