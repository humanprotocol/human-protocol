import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * The private key used for signing JSON Web Tokens (JWT).
   * Default: ''
   */
  get jwtPrivateKey(): string {
    return this.configService.get<string>('JWT_PRIVATE_KEY', '');
  }

  /**
   * The public key used for verifying JSON Web Tokens (JWT).
   * Default: ''
   */
  get jwtPublicKey(): string {
    return this.configService.get<string>('JWT_PUBLIC_KEY', '');
  }

  /**
   * The expiration time (in seconds) for access tokens.
   * Default: 600
   */
  get accessTokenExpiresIn(): number {
    return +this.configService.get<number>('JWT_ACCESS_TOKEN_EXPIRES_IN', 600);
  }

  /**
   * The expiration time (in seconds) for refresh tokens.
   * Default: 3600
   */
  get refreshTokenExpiresIn(): number {
    return +this.configService.get<number>('REFRESH_TOKEN_EXPIRES_IN', 3600);
  }

  /**
   * The expiration time (in seconds) for email verification tokens.
   * Default: 86400
   */
  get verifyEmailTokenExpiresIn(): number {
    return +this.configService.get<number>(
      'VERIFY_EMAIL_TOKEN_EXPIRES_IN',
      86400,
    );
  }

  /**
   * The expiration time (in seconds) for forgot password tokens.
   * Default: 86400
   */
  get forgotPasswordExpiresIn(): number {
    return +this.configService.get<number>(
      'FORGOT_PASSWORD_TOKEN_EXPIRES_IN',
      86400,
    );
  }

  /**
   * The number of iterations used for generating API keys.
   * Default: 1000
   */
  get apiKeyIterations(): number {
    return +this.configService.get<number>('APIKEY_ITERATIONS', 1000);
  }

  /**
   * The length of the API key in characters.
   * Default: 64
   */
  get apiKeyLength(): number {
    return +this.configService.get<number>('APIKEY_KEY_LENGTH', 64);
  }

  /**
   * The site key for hCaptcha, used for CAPTCHA protection.
   * Default: ''
   */
  get hCaptchaSiteKey(): string {
    return this.configService.get<string>('HCAPTCHA_SITE_KEY', '');
  }

  /**
   * The secret key for hCaptcha, used for verifying CAPTCHA responses.
   * Default: ''
   */
  get hCaptchaSecret(): string {
    return this.configService.get<string>('HCAPTCHA_SECRET', '');
  }

  /**
   * The URL for the hCaptcha protection service.
   * Default: 'https://api.hcaptcha.com'
   */
  get hcaptchaProtectionUrl(): string {
    return this.configService.get<string>(
      'HCAPTCHA_PROTECTION_URL',
      'https://api.hcaptcha.com',
    );
  }
}
