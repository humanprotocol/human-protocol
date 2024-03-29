import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CvatConfigService {
  constructor(private configService: ConfigService) {}
  get jobSize(): number {
    return +this.configService.get<number>('CVAT_JOB_SIZE', 10);
  }
  get maxTime(): number {
    return +this.configService.get<number>('CVAT_MAX_TIME', 300);
  }
  get valSize(): number {
    return +this.configService.get<number>('CVAT_VAL_SIZE', 2);
  }
}
