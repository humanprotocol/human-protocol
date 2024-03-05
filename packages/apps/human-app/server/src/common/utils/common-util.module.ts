import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CommonHttpUtilService } from './common-http-util.service';

@Module({
  imports: [HttpModule],
  providers: [CommonHttpUtilService],
  exports: [CommonHttpUtilService],
})
export class CommonUtilModule {}
