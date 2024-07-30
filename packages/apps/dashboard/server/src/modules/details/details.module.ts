import { Module } from '@nestjs/common';

import { DetailsService } from './details.service';
import { DetailsController } from './details.controller';

@Module({
  controllers: [DetailsController],
  providers: [DetailsService],
})
export class DetailsModule {}
