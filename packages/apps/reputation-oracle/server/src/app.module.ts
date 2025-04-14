import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { envValidator } from './config';
import { EnvConfigModule } from './config/config.module';

import { DatabaseModule } from './database/database.module';

import { JwtAuthGuard } from './common/guards';
import { ExceptionFilter } from './common/filters/exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpValidationPipe } from './common/pipes';

import { HealthModule } from './modules/health/health.module';
import { ReputationModule } from './modules/reputation/reputation.module';
import { AuthModule } from './modules/auth/auth.module';
import { KycModule } from './modules/kyc/kyc.module';
import { CronJobModule } from './modules/cron-job/cron-job.module';
import { QualificationModule } from './modules/qualification/qualification.module';
import { EscrowCompletionModule } from './modules/escrow-completion/escrow-completion.module';
import { WebhookIncomingModule } from './modules/webhook/webhook-incoming.module';
import { WebhookOutgoingModule } from './modules/webhook/webhook-outgoing.module';
import { UserModule } from './modules/user';
import { NDAModule } from './modules/nda/nda.module';

import Environment from './utils/environment';
import { AppController } from './app.controller';
import { AbuseModule } from './modules/abuse/abuse.module';

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
      envFilePath: [`.env.${Environment.name}`, '.env'],
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
    WebhookIncomingModule,
    WebhookOutgoingModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
