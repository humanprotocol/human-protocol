import { Module } from '@nestjs/common';

import { DetailsService } from './details.service';
import { DetailsController } from './details.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [DetailsController],
  providers: [DetailsService],
})
export class DetailsModule {}
