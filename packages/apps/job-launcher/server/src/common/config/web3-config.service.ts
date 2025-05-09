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
   * Required
   */
  get privateKey(): string {
    return this.configService.getOrThrow<string>('WEB3_PRIVATE_KEY');
  }

  /**
   * Multiplier for gas price adjustments.
   * Default: 1
   */
  get gasPriceMultiplier(): number {
    return +this.configService.get<number>('GAS_PRICE_MULTIPLIER', 1);
  }

  /**
   * Address of the reputation oracle contract.
   * Required
   */
  get reputationOracleAddress(): string {
    return this.configService.getOrThrow<string>('REPUTATION_ORACLE_ADDRESS');
  }

  /**
   * List of reputation oracle addresses, typically comma-separated.
   * Required
   */
  get reputationOracles(): string {
    return this.configService.getOrThrow<string>('REPUTATION_ORACLES');
  }

  /**
   * URI for the hCaptcha recording oracle service.
   * Required
   */
  get hCaptchaRecordingOracleURI(): string {
    return this.configService.getOrThrow<string>(
      'HCAPTCHA_RECORDING_ORACLE_URI',
    );
  }

  /**
   * URI for the hCaptcha reputation oracle service.
   * Required
   */
  get hCaptchaReputationOracleURI(): string {
    return this.configService.getOrThrow<string>(
      'HCAPTCHA_REPUTATION_ORACLE_URI',
    );
  }
}
