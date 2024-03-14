import { StatisticsService } from './statistics.service';
import { Module } from '@nestjs/common';
import { ExternalApiModule } from '../../integrations/external-api/external-api.module';

@Module({
  imports: [ExternalApiModule],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
