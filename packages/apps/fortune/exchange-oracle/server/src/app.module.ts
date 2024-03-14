import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { JobModule } from './modules/job/job.module';
import { ConfigModule } from '@nestjs/config';
import { envValidator } from './common/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SnakeCaseInterceptor } from './common/interceptors/snake-case';
import { DatabaseModule } from './database/database.module';
import { WebhookModule } from './modules/webhook/webhook.module';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: SnakeCaseInterceptor,
    },
  ],
  imports: [
    JobModule,
    WebhookModule,
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV
        ? `.env.${process.env.NODE_ENV as string}`
        : '.env',
      validationSchema: envValidator,
    }),
    DatabaseModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
