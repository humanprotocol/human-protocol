import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { HttpValidationPipe } from './common/pipes';
import { JobModule } from './modules/job/job.module';

import { AppController } from './app.controller';
import {
  envValidator,
  s3Config,
  serverConfig,
  web3Config,
} from './common/config';
import { SnakeCaseInterceptor } from './common/interceptors/snake-case';
import { WebhookModule } from './modules/webhook/webhook.module';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: HttpValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SnakeCaseInterceptor,
    },
  ],
  imports: [
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV
        ? `.env.${process.env.NODE_ENV as string}`
        : '.env',
      validationSchema: envValidator,
      load: [serverConfig, s3Config, web3Config],
    }),
    JobModule,
    WebhookModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
