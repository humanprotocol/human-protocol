import { Module } from '@nestjs/common';

import { NetworksService } from './networks.service';
import { NetworksController } from './networks.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [NetworksController],
  providers: [NetworksService],
  exports: [NetworksService],
})
export class NetworksModule {}
