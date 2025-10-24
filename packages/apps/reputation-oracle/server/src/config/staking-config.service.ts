import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StakingConfigService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Default asset symbol to check for staking eligibility.
   * Default: 'HMT'
   */
  get asset(): string {
    return this.configService.get('STAKING_ASSET') || 'HMT';
  }

  /**
   * Minimum threshold (asset units) required for staking eligibility.
   * Default: 1000
   */
  get minThreshold(): number {
    return Number(this.configService.get('STAKING_MIN_THRESHOLD')) || 1000;
  }

  /**
   * Optional per-exchange HTTP timeout, in milliseconds.
   * Default: 2000
   */
  get timeoutMs(): number {
    return Number(this.configService.get('STAKING_TIMEOUT_MS')) || 2000;
  }
}
