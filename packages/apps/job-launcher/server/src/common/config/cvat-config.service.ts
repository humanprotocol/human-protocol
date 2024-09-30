import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CvatConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * The size of the job in CVAT, typically representing the number of items or tasks.
   * Default: 10
   */
  get jobSize(): number {
    return +this.configService.get<number>('CVAT_JOB_SIZE', 10);
  }

  /**
   * The maximum allowed time (in seconds) for a CVAT job to be completed.
   * Default: 300
   */
  get maxTime(): number {
    return +this.configService.get<number>('CVAT_MAX_TIME', 300);
  }

  /**
   * The size of validation jobs in CVAT, usually representing the number of validation items.
   * Default: 2
   */
  get valSize(): number {
    return +this.configService.get<number>('CVAT_VAL_SIZE', 2);
  }

  /**
   * The multiplier for the size of skeleton jobs in CVAT, used to scale the job size for skeleton tasks.
   * Default: 6
   */
  get skeletonsJobSizeMultiplier(): number {
    return +this.configService.get<number>(
      'CVAT_SKELETONS_JOB_SIZE_MULTIPLIER',
      6,
    );
  }
}
