import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [HttpModule, StorageModule],
  controllers: [StatsController],
  exports: [StatsService],
  providers: [StatsService],
})
export class StatsModule {}
