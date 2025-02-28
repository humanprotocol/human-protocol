import { Module } from '@nestjs/common';
import { HCaptchaService } from './hcaptcha.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [HCaptchaService],
  exports: [HCaptchaService],
})
export class HCaptchaModule {}
