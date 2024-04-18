import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Web3ConfigService {
  constructor(private configService: ConfigService) {}
  get env(): string {
    return this.configService.get<string>('WEB3_ENV', 'testnet');
  }
  get privateKey(): string {
    return this.configService.get<string>('WEB3_PRIVATE_KEY', '');
  }
  get gasPriceMultiplier(): number {
    return +this.configService.get<number>('GAS_PRICE_MULTIPLIER', 1);
  }
}
