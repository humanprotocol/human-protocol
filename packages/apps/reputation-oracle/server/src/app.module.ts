import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { DatabaseModule } from './database/database.module';
import { HttpValidationPipe } from './common/pipes';
import { HealthModule } from './modules/health/health.module';
import { ReputationModule } from './modules/reputation/reputation.module';
import { Web3Module } from './modules/web3/web3.module';
import { envValidator } from './config';
import { AuthModule } from './modules/auth/auth.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { KycModule } from './modules/kyc/kyc.module';
import { CronJobModule } from './modules/cron-job/cron-job.module';
import { PayoutModule } from './modules/payout/payout.module';
import { EnvConfigModule } from './config/config.module';
import { HCaptchaModule } from './integrations/hcaptcha/hcaptcha.module';
import { ExceptionFilter } from './common/filters/exception.filter';
import { QualificationModule } from './modules/qualification/qualification.module';
import { EscrowCompletionModule } from './modules/escrow-completion/escrow-completion.module';
import { WebhookIncomingModule } from './modules/webhook/webhook-incoming.module';
import { WebhookOutgoingModule } from './modules/webhook/webhook-outgoing.module';
import { EmailModule } from './modules/email/module';
import Environment from './utils/environment';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: HttpValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ExceptionFilter,
    },
  ],
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      /**
       * First value found takes precendece
       */
      envFilePath: [`.env.${Environment.name}`, '.env'],
      validationSchema: envValidator,
    }),
    DatabaseModule,
    HealthModule,
    ReputationModule,
    WebhookIncomingModule,
    WebhookOutgoingModule,
    Web3Module,
    AuthModule,
    KycModule,
    ServeStaticModule.forRoot({
      rootPath: join(
        __dirname,
        '../../../../../../',
        'node_modules/swagger-ui-dist',
      ),
    }),
    CronJobModule,
    PayoutModule,
    EnvConfigModule,
    HCaptchaModule,
    QualificationModule,
    EscrowCompletionModule,
    EmailModule,
  ],
})
export class AppModule {}
