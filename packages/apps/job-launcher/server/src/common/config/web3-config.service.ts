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
  get reputationOracleAddress(): string {
    return this.configService.get<string>('REPUTATION_ORACLE_ADDRESS', '');
  }
  get reputationOracles(): string {
    return this.configService.get<string>('REPUTATION_ORACLES', '');
  }
  get fortuneExchangeOracleAddress(): string {
    return this.configService.get<string>(
      'FORTUNE_EXCHANGE_ORACLE_ADDRESS',
      '',
    );
  }
  get fortuneRecordingOracleAddress(): string {
    return this.configService.get<string>(
      'FORTUNE_RECORDING_ORACLE_ADDRESS',
      '',
    );
  }
  get cvatExchangeOracleAddress(): string {
    return this.configService.get<string>('CVAT_EXCHANGE_ORACLE_ADDRESS', '');
  }
  get cvatRecordingOracleAddress(): string {
    return this.configService.get<string>('CVAT_RECORDING_ORACLE_ADDRESS', '');
  }
  get hCaptchaRecordingOracleURI(): string {
    return this.configService.get<string>('HCAPTCHA_RECORDING_ORACLE_URI', '');
  }
  get hCaptchaReputationOracleURI(): string {
    return this.configService.get<string>('HCAPTCHA_REPUTATION_ORACLE_URI', '');
  }
  get hCaptchaOracleAddress(): string {
    return this.configService.get<string>('HCAPTCHA_ORACLE_ADDRESS', '');
  }
}
