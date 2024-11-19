import { Module } from '@nestjs/common';

import { DetailsService } from './details.service';
import { DetailsController } from './details.controller';
import { HttpModule } from '@nestjs/axios';
import { StatsModule } from '../stats/stats.module';

@Module({
  imports: [HttpModule, StatsModule],
  controllers: [DetailsController],
  providers: [DetailsService],
})
export class DetailsModule {}
