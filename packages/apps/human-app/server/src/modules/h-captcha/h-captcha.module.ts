import { Module } from '@nestjs/common';
import { ReputationOracleModule } from '../../integrations/reputation-oracle/reputation-oracle.module';
import { HCaptchaLabelingModule } from '../../integrations/h-captcha-labeling/h-captcha-labeling.module';
import { HCaptchaService } from './h-captcha.service';
import { HCaptchaMapperProfile } from './h-captcha.mapper.profile';

@Module({
  imports: [ReputationOracleModule, HCaptchaLabelingModule],
  providers: [HCaptchaService, HCaptchaMapperProfile],
  exports: [HCaptchaService],
})
export class HCaptchaModule {}
