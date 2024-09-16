import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * The secret key used for authenticating requests to the Stripe API.
   * Required
   */
  get secretKey(): string {
    return this.configService.getOrThrow<string>('STRIPE_SECRET_KEY');
  }

  /**
   * The version of the Stripe API to use for requests.
   * Default: '2022-11-15'
   */
  get apiVersion(): string {
    return this.configService.get<string>('STRIPE_API_VERSION', '2022-11-15');
  }

  /**
   * The name of the application interacting with the Stripe API.
   * Default: 'Fortune'
   */
  get appName(): string {
    return this.configService.get<string>('STRIPE_APP_NAME', 'Fortune');
  }

  /**
   * The version of the application interacting with the Stripe API.
   * Default: '0.0.1'
   */
  get appVersion(): string {
    return this.configService.get<string>('STRIPE_APP_VERSION', '0.0.1');
  }

  /**
   * The URL of the application's information page.
   * Default: 'https://hmt.ai'
   */
  get appInfoURL(): string {
    return this.configService.get<string>(
      'STRIPE_APP_INFO_URL',
      'https://hmt.ai',
    );
  }
}
