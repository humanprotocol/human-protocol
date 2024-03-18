import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../src/database/database.module';
import { JwtAuthGuard } from '../src/common/guards';
import { envValidator } from '../src/common/config';
import { CronJobModule } from '../src/modules/cron-job/cron-job.module';
import { DatabaseExceptionFilter } from '../src/common/exceptions/database.filter';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: DatabaseExceptionFilter,
    },
  ],
  imports: [
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV
        ? `.env.${process.env.NODE_ENV as string}`
        : '.env',
      validationSchema: envValidator,
    }),
    DatabaseModule,
    CronJobModule,
  ],
})
export class CronsAppModule {}
