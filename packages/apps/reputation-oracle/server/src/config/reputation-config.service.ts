import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ReputationConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * The threshold value that defines the lower boundary of reputation level.
   * Users with a reputation below this value are considered to have a low reputation.
   * Default: 300
   */
  get lowLevel(): number {
    return +this.configService.get<number>('REPUTATION_LEVEL_LOW', 300);
  }

  /**
   * The threshold value that defines the upper boundary of reputation level.
   * Users with a reputation above this value are considered to have a high reputation.
   * Default: 700
   */
  get highLevel(): number {
    return +this.configService.get<number>('REPUTATION_LEVEL_HIGH', 700);
  }
}
