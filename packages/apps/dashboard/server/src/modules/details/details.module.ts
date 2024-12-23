import { Module } from '@nestjs/common';

import { DetailsService } from './details.service';
import { DetailsController } from './details.controller';
import { HttpModule } from '@nestjs/axios';
import { NetworksModule } from '../networks/networks.module';

@Module({
  imports: [HttpModule, NetworksModule],
  controllers: [DetailsController],
  providers: [DetailsService],
})
export class DetailsModule {}
