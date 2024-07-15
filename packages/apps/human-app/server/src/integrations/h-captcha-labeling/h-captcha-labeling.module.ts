import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HCaptchaStatisticsGateway } from './h-captcha-statistics.gateway';
import { HCaptchaMapperProfile } from '../../modules/h-captcha/h-captcha.mapper.profile';
import { HCaptchaVerifyGateway } from './h-captcha-verify.gateway';

@Module({
  imports: [HttpModule],
  providers: [
    HCaptchaStatisticsGateway,
    HCaptchaVerifyGateway,
    HCaptchaMapperProfile,
  ],
  exports: [HCaptchaStatisticsGateway, HCaptchaVerifyGateway],
})
export class HCaptchaLabelingModule {}
