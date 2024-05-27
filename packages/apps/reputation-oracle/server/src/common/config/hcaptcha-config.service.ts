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
  get protectionURL(): string {
    return this.configService.get<string>(
      'HCAPTCHA_PROTECTION_URL',
      'https://api.hcaptcha.com',
    );
  }
  get exchangeURL(): string {
    return this.configService.get<string>(
      'HCAPTCHA_EXCHANGE_URL',
      'https://foundation-exchange.hmt.ai',
    );
  }
  get defaultLabelerLang(): string {
    return this.configService.get<string>(
      'HCAPTCHA_DEFAULT_LABELER_LANG',
      'en',
    );
  }
}
