import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { JobModule } from './modules/job/job.module';
import { ConfigModule } from '@nestjs/config';
import { envValidator } from './common/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { SnakeCaseInterceptor } from './common/interceptors/snake-case';
import { DatabaseModule } from './database/database.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { JwtAuthGuard } from './common/guards/jwt.auth';
import { JwtHttpStrategy } from './common/guards/strategy';
import { Web3Module } from './modules/web3/web3.module';
import { StatsModule } from './modules/stats/stats.module';
import { AssignmentModule } from './modules/assignment/assignment.module';
import { CronJobModule } from './modules/cron-job/cron-job.module';
import { HealthModule } from './modules/health/health.module';
import { EnvConfigModule } from './common/config/config.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SnakeCaseInterceptor,
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
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV
        ? `.env.${process.env.NODE_ENV as string}`
        : '.env',
      validationSchema: envValidator,
    }),
    DatabaseModule,
    EnvConfigModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
