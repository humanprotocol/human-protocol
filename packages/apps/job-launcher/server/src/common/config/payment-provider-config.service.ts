import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentProviderConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * The secret key used for authenticating requests to the payment providers API.
   * Required
   */
  get secretKey(): string {
    return this.configService.getOrThrow<string>('PAYMENT_PROVIDER_SECRET_KEY');
  }

  /**
   * The version of the payment providers to use for requests.
   * Default: '2022-11-15'
   */
  get apiVersion(): string {
    return this.configService.get<string>(
      'PAYMENT_PROVIDER_API_VERSION',
      '2022-11-15',
    );
  }

  /**
   * The name of the application interacting with the payment providers API.
   * Default: 'Fortune'
   */
  get appName(): string {
    return this.configService.get<string>(
      'PAYMENT_PROVIDER_APP_NAME',
      'Fortune',
    );
  }

  /**
   * The version of the application interacting with the payment providers API.
   * Default: '0.0.1'
   */
  get appVersion(): string {
    return this.configService.get<string>(
      'PAYMENT_PROVIDER_APP_VERSION',
      '0.0.1',
    );
  }

  /**
   * The URL of the application's information page.
   * Default: 'https://hmt.ai'
   */
  get appInfoURL(): string {
    return this.configService.get<string>(
      'PAYMENT_PROVIDER_APP_INFO_URL',
      'https://hmt.ai',
    );
  }
}
