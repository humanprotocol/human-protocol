import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
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
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { StorageModule } from './modules/storage/storage.module';
import { CronJobModule } from './modules/cron-job/cron-job.module';
import { SnakeCaseInterceptor } from './common/interceptors/snake-case';
import { WebhookModule } from './modules/webhook/webhook.module';
import { EnvConfigModule } from './common/config/config.module';
import { E2E_TEST_ENV } from './common/constants';
import { ExceptionFilter } from './common/exceptions/exception.filter';
import { ScheduleModule } from '@nestjs/schedule';

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
      provide: APP_FILTER,
      useClass: ExceptionFilter,
    },
  ],
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      ignoreEnvFile: process.env.NODE_ENV === E2E_TEST_ENV,
      ...(process.env.NODE_ENV !== E2E_TEST_ENV && {
        envFilePath: process.env.NODE_ENV
          ? `.env.${process.env.NODE_ENV as string}`
          : '.env',
      }),
      ...(process.env.NODE_ENV !== E2E_TEST_ENV && {
        validationSchema: envValidator,
      }),
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
    ServeStaticModule.forRoot({
      rootPath: join(
        __dirname,
        '../../../../../',
        'node_modules/swagger-ui-dist',
      ),
    }),
    CronJobModule,
    EnvConfigModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
