import { Module } from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { JwtHttpGuard, RolesGuard } from './common/guards';
import { HttpValidationPipe } from './common/pipes';
import { HealthModule } from './modules/health/health.module';
import { networkMap, networks } from './common/decorators/network';
import { ReputationModule } from './modules/reputation/reputation.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { Web3Module } from './modules/web3/web3.module';


@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtHttpGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_PIPE,
      useClass: HttpValidationPipe,
    },
  ],
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV as string}`,
    }),
    DatabaseModule,
    HealthModule,
    ReputationModule,
    WebhookModule,
    Web3Module
  ],
  controllers: [AppController],
})
export class AppModule {}
