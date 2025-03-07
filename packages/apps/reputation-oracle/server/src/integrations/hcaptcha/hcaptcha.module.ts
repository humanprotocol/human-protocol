import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { HCaptchaService } from './hcaptcha.service';

@Module({
  imports: [
    HttpModule.register({
      validateStatus: () => true,
    }),
  ],
  providers: [HCaptchaService],
  exports: [HCaptchaService],
})
export class HCaptchaModule {}
