import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { JwtAuthGuard } from './common/guards';
import { ExceptionFilter } from './common/filters/exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpValidationPipe } from './common/pipes';
import { envValidator, EnvConfigModule } from './config';
import { DatabaseModule } from './database';

import { AbuseModule } from './modules/abuse';
import { AuthModule } from './modules/auth';
import { CronJobModule } from './modules/cron-job';
import { EscrowCompletionModule } from './modules/escrow-completion';
import { HealthModule } from './modules/health';
import {
  IncomingWebhookModule,
  OutgoingWebhookModule,
} from './modules/webhook';
import { KycModule } from './modules/kyc';
import { NDAModule } from './modules/nda';
import { QualificationModule } from './modules/qualification';
import { ReputationModule } from './modules/reputation';
import { UserModule } from './modules/user';

import Environment from './utils/environment';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_PIPE,
      useClass: HttpValidationPipe,
    },
    /**
     * Interceptors are called:
     * - for request: in direct order
     * - for response: in reverse order
     *
     * So order matters here for serialization.
     */
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ExceptionFilter,
    },
  ],
  imports: [
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(
        __dirname,
        '../../../../../../',
        'node_modules/swagger-ui-dist',
      ),
    }),
    ConfigModule.forRoot({
      /**
       * First value found takes precendece
       */
      envFilePath: [`.env.${Environment.name}`, '.env.local', '.env'],
      validationSchema: envValidator,
    }),
    EnvConfigModule,
    DatabaseModule,
    AbuseModule,
    AuthModule,
    CronJobModule,
    UserModule,
    NDAModule,
    EscrowCompletionModule,
    HealthModule,
    KycModule,
    QualificationModule,
    ReputationModule,
    UserModule,
    IncomingWebhookModule,
    OutgoingWebhookModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
