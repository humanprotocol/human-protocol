import { RedisService } from './redis.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
