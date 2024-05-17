import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HCaptchaConfigService {
  constructor(private configService: ConfigService) {}
  get siteKey(): string {
    return this.configService.get<string>('HCAPTCHA_SITE_KEY', '');
  }
  get apiKey(): string {
    return this.configService.get<string>('HCAPTCHA_API_KEY', '');
  }
  get secret(): string {
    return this.configService.get<string>('HCAPTCHA_SECRET', '');
  }
  get exchangeURL(): string {
    return this.configService.get<string>(
      'HCAPTCHA_EXCHANGE_URL',
      'https://foundation-exchange.hmt.ai',
    );
  }
  get jobAPIKey(): string {
    return this.configService.get<string>('HCAPTHCHA_JOB_API_KEY', '');
  }
}
