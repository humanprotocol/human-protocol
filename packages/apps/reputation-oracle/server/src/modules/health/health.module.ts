import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigModule } from '@nestjs/config';

import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, ConfigModule],
  controllers: [HealthController],
})
export class HealthModule {}
