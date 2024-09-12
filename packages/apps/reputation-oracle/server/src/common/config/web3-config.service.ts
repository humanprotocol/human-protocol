import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Web3ConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * The environment in which the Web3 application is running.
   * Default: 'testnet'
   */
  get env(): string {
    return this.configService.get<string>('WEB3_ENV', 'testnet');
  }

  /**
   * The private key used for signing transactions.
   * Default: ''
   */
  get privateKey(): string {
    return this.configService.get<string>('WEB3_PRIVATE_KEY', '');
  }

  /**
   * Multiplier for gas price adjustments.
   * Default: 1
   */
  get gasPriceMultiplier(): number {
    return +this.configService.get<number>('GAS_PRICE_MULTIPLIER', 1);
  }
}
