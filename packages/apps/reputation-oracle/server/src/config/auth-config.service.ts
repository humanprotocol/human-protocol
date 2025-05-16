import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * The private key used for signing JSON Web Tokens (JWT).
   * Required
   */
  get jwtPrivateKey(): string {
    return this.configService.getOrThrow('JWT_PRIVATE_KEY');
  }

  /**
   * The public key used for verifying JSON Web Tokens (JWT).
   * Required
   */
  get jwtPublicKey(): string {
    return this.configService.getOrThrow('JWT_PUBLIC_KEY');
  }

  /**
   * The expiration time (in seconds) for access tokens.
   * Default: 600
   */
  get accessTokenExpiresIn(): number {
    return Number(this.configService.get('JWT_ACCESS_TOKEN_EXPIRES_IN')) || 600;
  }

  /**
   * The expiration time (in ms) for refresh tokens.
   * Default: 3600000
   */
  get refreshTokenExpiresIn(): number {
    const configValueSeconds =
      Number(this.configService.get('JWT_REFRESH_TOKEN_EXPIRES_IN')) || 3600;
    return configValueSeconds * 1000;
  }

  /**
   * The expiration time (in ms) for email verification tokens.
   * Default: 86400000
   */
  get verifyEmailTokenExpiresIn(): number {
    const configValueSeconds =
      Number(this.configService.get('VERIFY_EMAIL_TOKEN_EXPIRES_IN')) || 86400;
    return configValueSeconds * 1000;
  }

  /**
   * The expiration time (in ms) for forgot password tokens.
   * Default: 86400000
   */
  get forgotPasswordExpiresIn(): number {
    const configValueSeconds =
      Number(this.configService.get('FORGOT_PASSWORD_TOKEN_EXPIRES_IN')) ||
      86400;
    return configValueSeconds * 1000;
  }

  /**
   * HUMAN App secret key for machine-to-machine communication
   */
  get humanAppSecretKey(): string {
    return this.configService.getOrThrow('HUMAN_APP_SECRET_KEY');
  }
}
