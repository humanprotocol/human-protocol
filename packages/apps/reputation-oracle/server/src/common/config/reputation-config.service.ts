import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ReputationConfigService {
  constructor(private configService: ConfigService) {}
  get lowLevel(): number {
    return +this.configService.get<number>('REPUTATION_LEVEL_LOW', 300);
  }
  get highLevel(): number {
    return +this.configService.get<number>('REPUTATION_LEVEL_HIGH', 700);
  }
}
