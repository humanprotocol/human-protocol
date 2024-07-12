import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

import { EnvironmentConfigService } from '../../common/config/env-config.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);
  constructor(
    private readonly envConfigService: EnvironmentConfigService,
    private readonly httpService: HttpService,
    private readonly redisService: RedisService,
  ) {}
  public async hmtPrice(): Promise<number> {
    const cachedHmtPrice = await this.redisService.getHmtPrice();
    if (cachedHmtPrice) {
      return cachedHmtPrice;
    }

    const { data } = await lastValueFrom(
      this.httpService.get(this.envConfigService.hmtPriceSource, {
        headers: {
          'x-cg-demo-api-key': this.envConfigService.hmtPriceSourceApiKey,
        },
      }),
    );
    const hmtPrice =
      data[this.envConfigService.hmtPriceFromKey][
        this.envConfigService.hmtPriceToKey
      ];
    await this.redisService.setHmtPrice(hmtPrice);
    return hmtPrice;
  }
}
