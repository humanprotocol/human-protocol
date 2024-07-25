import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';

import * as Joi from 'joi';

import { AppController } from './app.controller';
import { CacheFactoryConfig } from './common/config/cache-factory.config';
import { CommonConfigModule } from './common/config/config.module';
import { DetailsModule } from './modules/details/details.module';
import { RedisModule } from './modules/redis/redis.module';
import { StatsModule } from './modules/stats/stats.module';

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
        SUBGRAPH_API_KEY: Joi.string().required(),
      }),
    }),
    CacheModule.registerAsync(CacheFactoryConfig),
    CommonConfigModule,
    DetailsModule,
    RedisModule,
    StatsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
