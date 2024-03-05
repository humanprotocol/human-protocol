import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { CommonUtilModule } from '../../common/utils/common-util.module';

@Module({
  imports: [CommonUtilModule],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
