import { Inject, Injectable, Logger } from '@nestjs/common';
import { ChainId, NETWORKS, StatisticsClient } from '@human-protocol/sdk';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

import {
  EnvironmentConfigService,
  MINIMUM_ESCROWS_COUNT,
  MINIMUM_HMT_TRANSFERS,
} from '../../common/config/env-config.service';
import { OPERATING_NETWORKS_CACHE_KEY } from '../../common/config/redis-config.service';
import { MAINNET_CHAIN_IDS } from '../../common/utils/constants';

@Injectable()
export class NetworksService {
  private readonly logger = new Logger(NetworksService.name);
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly envConfigService: EnvironmentConfigService,
  ) {}

  public async getOperatingNetworks(): Promise<ChainId[]> {
    const cachedNetworks = await this.cacheManager.get<ChainId[]>(
      OPERATING_NETWORKS_CACHE_KEY,
    );

    if (cachedNetworks) {
      return cachedNetworks;
    }

    const currentMonth = new Date();
    const oneMonthAgo = new Date(currentMonth);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const filterDate = new Date(currentMonth);
    filterDate.setMonth(
      filterDate.getMonth() - this.envConfigService.networkUsageFilterMonths,
    );

    const availableNetworks = [];

    for (const chainId of Object.values(MAINNET_CHAIN_IDS)) {
      const networkConfig = NETWORKS[chainId];
      if (!networkConfig) continue;

      const statisticsClient = new StatisticsClient(networkConfig);
      try {
        const [hmtData, escrowStats] = await Promise.all([
          statisticsClient.getHMTDailyData({
            from: new Date(Math.floor(filterDate.getTime() / 1000) * 1000),
          }),
          statisticsClient.getEscrowStatistics({
            from: new Date(Math.floor(oneMonthAgo.getTime() / 1000) * 1000),
          }),
        ]);

        const totalTransactionCount = hmtData.reduce(
          (sum, day) => sum + day.totalTransactionCount,
          0,
        );

        const recentEscrowsCreated =
          escrowStats.totalEscrows >= MINIMUM_ESCROWS_COUNT;
        const sufficientHMTTransfers =
          totalTransactionCount > MINIMUM_HMT_TRANSFERS;

        if (recentEscrowsCreated && sufficientHMTTransfers) {
          availableNetworks.push(chainId);
        }
      } catch (error) {
        this.logger.error(
          `Error processing network ${chainId}: ${error.message}`,
        );
      }
    }

    await this.cacheManager.set(
      OPERATING_NETWORKS_CACHE_KEY,
      availableNetworks,
      this.envConfigService.networkOperatingCacheTtl,
    );
    return availableNetworks;
  }
}
