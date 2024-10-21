import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './indicators/redis.health';

@Module({
  controllers: [HealthController],
  imports: [TerminusModule],
  providers: [RedisHealthIndicator],
})
export class HealthModule {}
