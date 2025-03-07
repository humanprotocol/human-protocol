import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Module } from '@nestjs/common';

import * as Joi from 'joi';

import { AppController } from './app.controller';
import { CacheFactoryConfig } from './common/config/cache-factory.config';
import { CommonConfigModule } from './common/config/config.module';
import { DetailsModule } from './modules/details/details.module';
import { StatsModule } from './modules/stats/stats.module';
import { NetworksModule } from './modules/networks/networks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV
        ? `.env.${process.env.NODE_ENV as string}`
        : '.env',
      isGlobal: true,
      validationSchema: Joi.object({
        HOST: Joi.string().required(),
        PORT: Joi.number().port().default(3000),
        REDIS_HOST: Joi.string(),
        REDIS_PORT: Joi.number(),
        SUBGRAPH_API_KEY: Joi.string(),
        HCAPTCHA_API_KEY: Joi.string().required(),
        CACHE_HMT_PRICE_TTL: Joi.number(),
        CACHE_HMT_GENERAL_STATS_TTL: Joi.number(),
        HCAPTCHA_STATS_ENABLED: Joi.boolean().default(true),
        NETWORKS_OPERATING_CACHE_TTL: Joi.number(),
      }),
    }),
    CacheModule.registerAsync(CacheFactoryConfig),
    CommonConfigModule,
    DetailsModule,
    ScheduleModule.forRoot(),
    StatsModule,
    NetworksModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
