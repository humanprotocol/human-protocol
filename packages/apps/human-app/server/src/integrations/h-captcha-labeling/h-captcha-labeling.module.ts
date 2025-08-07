import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HCaptchaStatisticsGateway } from './h-captcha-statistics.gateway';
import { HCaptchaVerifyGateway } from './h-captcha-verify.gateway';

@Module({
  imports: [HttpModule],
  providers: [HCaptchaStatisticsGateway, HCaptchaVerifyGateway],
  exports: [HCaptchaStatisticsGateway, HCaptchaVerifyGateway],
})
export class HCaptchaLabelingModule {}
