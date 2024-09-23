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
   * Address of the Fortune exchange oracle contract.
   * Required
   */
  get fortuneExchangeOracleAddress(): string {
    return this.configService.getOrThrow<string>(
      'FORTUNE_EXCHANGE_ORACLE_ADDRESS',
    );
  }

  /**
   * Address of the Fortune recording oracle contract.
   * Required
   */
  get fortuneRecordingOracleAddress(): string {
    return this.configService.getOrThrow<string>(
      'FORTUNE_RECORDING_ORACLE_ADDRESS',
    );
  }

  /**
   * Address of the CVAT exchange oracle contract.
   * Required
   */
  get cvatExchangeOracleAddress(): string {
    return this.configService.getOrThrow<string>(
      'CVAT_EXCHANGE_ORACLE_ADDRESS',
    );
  }

  /**
   * Address of the CVAT recording oracle contract.
   * Required
   */
  get cvatRecordingOracleAddress(): string {
    return this.configService.getOrThrow<string>(
      'CVAT_RECORDING_ORACLE_ADDRESS',
    );
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

  /**
   * Address of the hCaptcha oracle contract.
   * Required
   */
  get hCaptchaOracleAddress(): string {
    return this.configService.getOrThrow<string>('HCAPTCHA_ORACLE_ADDRESS');
  }
}
