import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { StorageModule } from '../storage/storage.module';
import { NetworksModule } from '../networks/networks.module';

@Module({
  imports: [HttpModule, StorageModule, NetworksModule],
  controllers: [StatsController],
  exports: [StatsService],
  providers: [StatsService],
})
export class StatsModule {}
