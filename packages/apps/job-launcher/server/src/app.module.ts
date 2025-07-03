import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';
import { AppController } from './app.controller';
import { EnvConfigModule } from './common/config/config.module';
import { envValidator } from './common/config/env-schema';
import { ExceptionFilter } from './common/exceptions/exception.filter';
import { JwtAuthGuard } from './common/guards';
import { SnakeCaseInterceptor } from './common/interceptors/snake-case';
import { TransformEnumInterceptor } from './common/interceptors/transform-enum.interceptor';
import { HttpValidationPipe } from './common/pipes';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { CronJobModule } from './modules/cron-job/cron-job.module';
import { HealthModule } from './modules/health/health.module';
import { JobModule } from './modules/job/job.module';
import { PaymentModule } from './modules/payment/payment.module';
import { QualificationModule } from './modules/qualification/qualification.module';
import { StatisticModule } from './modules/statistic/statistic.module';
import { StorageModule } from './modules/storage/storage.module';
import { UserModule } from './modules/user/user.module';
import { Web3Module } from './modules/web3/web3.module';
import { WebhookModule } from './modules/webhook/webhook.module';

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
    {
      provide: APP_INTERCEPTOR,
      useClass: SnakeCaseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformEnumInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 1000,
        },
      ],
    }),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      /**
       * First value found takes precendece
       */
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env.local', '.env'],
      validationSchema: envValidator,
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    UserModule,
    JobModule,
    PaymentModule,
    Web3Module,
    StorageModule,
    WebhookModule,
    StatisticModule,
    QualificationModule,
    ServeStaticModule.forRoot({
      rootPath: join(
        __dirname,
        '../../../../../../',
        'node_modules/swagger-ui-dist',
      ),
    }),
    CronJobModule,
    EnvConfigModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
