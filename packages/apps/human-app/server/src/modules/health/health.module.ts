import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { CacheManagerHealthIndicator } from './indicators/cache-manager.health';

@Module({
  controllers: [HealthController],
  imports: [TerminusModule],
  providers: [CacheManagerHealthIndicator],
})
export class HealthModule {}
