import { Module } from '@nestjs/common';
import { RateService } from './rate.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [RateService],
  exports: [RateService],
})
export class RateModule {}
