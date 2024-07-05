import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { RedisService } from '../redis/redis.service';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';

@Module({
  imports: [HttpModule],
  controllers: [StatsController],
  providers: [RedisService, StatsService],
})
export class StatsModule {}
