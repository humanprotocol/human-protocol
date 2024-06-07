import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeConfigService {
  constructor(private configService: ConfigService) {}
  get secretKey(): string {
    return this.configService.get<string>('STRIPE_SECRET_KEY', '');
  }
  get apiVersion(): string {
    return this.configService.get<string>('STRIPE_API_VERSION', '2022-11-15');
  }
  get appName(): string {
    return this.configService.get<string>('STRIPE_APP_NAME', 'Fortune');
  }
  get appVersion(): string {
    return this.configService.get<string>('STRIPE_APP_VERSION', '0.0.1');
  }
  get appInfoURL(): string {
    return this.configService.get<string>(
      'STRIPE_APP_INFO_URL',
      'https://hmt.ai',
    );
  }
}
