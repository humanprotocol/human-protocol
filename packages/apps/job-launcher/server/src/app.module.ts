import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';

import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { JwtAuthGuard } from './common/guards';
import { HttpValidationPipe } from './common/pipes';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { JobModule } from './modules/job/job.module';
import { PaymentModule } from './modules/payment/payment.module';
import { Web3Module } from './modules/web3/web3.module';
import { envValidator } from './common/config/env-schema';
import { StorageModule } from './modules/storage/storage.module';
import { CronJobModule } from './modules/cron-job/cron-job.module';
import { SnakeCaseInterceptor } from './common/interceptors/snake-case';
import { WebhookModule } from './modules/webhook/webhook.module';
import { EnvConfigModule } from './common/config/config.module';
import { ExceptionFilter } from './common/exceptions/exception.filter';
import { StatisticModule } from './modules/statistic/statistic.module';
import { QualificationModule } from './modules/qualification/qualification.module';
import { TransformEnumInterceptor } from './common/interceptors/transform-enum.interceptor';
import Environment from './common/utils/environment';

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
  ],
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      /**
       * First value found takes precendece
       */
      envFilePath: [`.env.${Environment.name}`, '.env.local', '.env'],
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
