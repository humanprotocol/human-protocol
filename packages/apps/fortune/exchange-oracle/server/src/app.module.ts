import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { envValidator } from './common/config';
import { EnvConfigModule } from './common/config/config.module';
import { ExceptionFilter } from './common/exceptions/exception.filter';
import { JwtHttpStrategy } from './common/guards/strategy';
import { SnakeCaseInterceptor } from './common/interceptors/snake-case';
import { TransformEnumInterceptor } from './common/interceptors/transform-enum.interceptor';
import { DatabaseModule } from './database/database.module';
import { AssignmentModule } from './modules/assignment/assignment.module';
import { CronJobModule } from './modules/cron-job/cron-job.module';
import { HealthModule } from './modules/health/health.module';
import { JobModule } from './modules/job/job.module';
import { StatsModule } from './modules/stats/stats.module';
import { UserModule } from './modules/user/user.module';
import { Web3Module } from './modules/web3/web3.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { HttpValidationPipe } from './common/pipes';

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
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformEnumInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ExceptionFilter,
    },
    JwtHttpStrategy,
  ],
  imports: [
    ScheduleModule.forRoot(),
    HealthModule,
    AssignmentModule,
    JobModule,
    WebhookModule,
    Web3Module,
    StatsModule,
    CronJobModule,
    UserModule,
    ConfigModule.forRoot({
      /**
       * First value found takes precendece
       */
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
      validationSchema: envValidator,
    }),
    DatabaseModule,
    EnvConfigModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
