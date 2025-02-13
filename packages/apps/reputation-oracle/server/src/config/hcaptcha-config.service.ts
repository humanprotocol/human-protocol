import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HCaptchaConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * The site key for the hCaptcha service, used for client-side verification.
   * Required
   */
  get siteKey(): string {
    return this.configService.getOrThrow<string>('HCAPTCHA_SITE_KEY');
  }

  /**
   * The API key for the hCaptcha service, used for server-side verification and operations.
   * Required
   */
  get apiKey(): string {
    return this.configService.getOrThrow<string>('HCAPTCHA_API_KEY');
  }

  /**
   * The secret key for the hCaptcha service, used for server-side authentication.
   * Required
   */
  get secret(): string {
    return this.configService.getOrThrow<string>('HCAPTCHA_SECRET');
  }

  /**
   * The URL for hCaptcha API endpoints used for protection and verification.
   * Default: 'https://api.hcaptcha.com'
   */
  get protectionURL(): string {
    return this.configService.get<string>(
      'HCAPTCHA_PROTECTION_URL',
      'https://api.hcaptcha.com',
    );
  }

  /**
   * The URL for hCaptcha labeling service, used for managing and accessing labeler accounts.
   * Default: 'https://foundation-accounts.hmt.ai'
   */
  get labelingURL(): string {
    return this.configService.get<string>(
      'HCAPTCHA_LABELING_URL',
      'https://foundation-accounts.hmt.ai',
    );
  }

  /**
   * The default language code for the hCaptcha labeler interface.
   * Default: 'en'
   */
  get defaultLabelerLang(): string {
    return this.configService.get<string>(
      'HCAPTCHA_DEFAULT_LABELER_LANG',
      'en',
    );
  }
}
