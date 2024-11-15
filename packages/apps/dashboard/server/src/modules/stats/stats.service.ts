import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import dayjs from 'dayjs';
import { Cron } from '@nestjs/schedule';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ChainId, NETWORKS, StatisticsClient } from '@human-protocol/sdk';
import {
  EnvironmentConfigService,
  HCAPTCHA_STATS_API_START_DATE,
  HMT_STATS_START_DATE,
  MINIMUM_HMT_TRANSFERS,
} from '../../common/config/env-config.service';
import {
  HCAPTCHA_PREFIX,
  HMT_PREFIX,
  RedisConfigService,
} from '../../common/config/redis-config.service';
import { HCAPTCHA_STATS_START_DATE } from '../../common/config/env-config.service';
import { HcaptchaDailyStats, HcaptchaStats } from './dto/hcaptcha.dto';
import { HmtGeneralStatsDto } from './dto/hmt-general-stats.dto';
import { MainnetsId } from '../../common/utils/constants';
import { DailyHMTData } from '@human-protocol/sdk/dist/graphql';
import { CachedHMTData } from './stats.interface';
import { HmtDailyStatsData } from './dto/hmt.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class StatsService implements OnModuleInit {
  private readonly logger = new Logger(StatsService.name);
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly redisConfigService: RedisConfigService,
    private readonly envConfigService: EnvironmentConfigService,
    private readonly httpService: HttpService,
    private readonly storageService: StorageService,
  ) {}

  async onModuleInit() {
    const isHistoricalDataFetched = await this.isHistoricalDataFetched();
    const isHmtGeneralStatsFetched = await this.isHmtGeneralStatsFetched();
    const isHmtDailyStatsFetched = await this.isHmtDailyStatsFetched();
    if (!isHistoricalDataFetched) {
      await this.fetchHistoricalHcaptchaStats();
    }
    if (!isHmtGeneralStatsFetched) {
      await this.fetchHmtGeneralStats();
    }
    if (!isHmtDailyStatsFetched) {
      await this.fetchHistoricalHmtStats();
    }
  }

  private async isHistoricalDataFetched(): Promise<boolean> {
    const data = await this.cacheManager.get<HcaptchaDailyStats>(
      `${HCAPTCHA_PREFIX}${HCAPTCHA_STATS_START_DATE}`,
    );
    return !!data;
  }

  private async fetchHistoricalHcaptchaStats(): Promise<void> {
    this.logger.log('Fetching historical hCaptcha stats.');
    let startDate = dayjs(HCAPTCHA_STATS_API_START_DATE);
    const currentDate = dayjs();
    const dates = [];

    while (startDate <= currentDate) {
      const from = startDate.startOf('month').format('YYYY-MM-DD');
      const to = startDate.endOf('month').format('YYYY-MM-DD');

      dates.push({ from, to });

      startDate = startDate.add(1, 'month');
    }

    const results = await this.storageService.downloadFile(
      this.envConfigService.hCaptchaStatsFile,
    );

    for (const range of dates) {
      const { data } = await lastValueFrom(
        this.httpService.get(this.envConfigService.hCaptchaStatsSource, {
          params: {
            start_date: range.from,
            end_date: range.to,
            api_key: this.envConfigService.hCaptchaApiKey,
          },
        }),
      );
      results.push(data);
    }

    for (const monthData of results) {
      for (const [date, value] of Object.entries<any>(monthData)) {
        const multiplier = date <= '2022-11-30' ? 18 : 9;
        if (value.served) delete value.served;
        value.solved *= multiplier;
        if (date !== 'total') {
          await this.cacheManager.set(`${HCAPTCHA_PREFIX}${date}`, value);
        } else {
          const dates = Object.keys(monthData).filter((key) => key !== 'total');
          if (dates.length > 0) {
            const month = dayjs(dates[0]).format('YYYY-MM');
            await this.cacheManager.set(`${HCAPTCHA_PREFIX}${month}`, value);
          }
        }
      }
    }
  }

  private async isHmtGeneralStatsFetched(): Promise<boolean> {
    const data = await this.cacheManager.get<HmtGeneralStatsDto>(
      this.redisConfigService.hmtGeneralStatsCacheKey,
    );
    return !!data;
  }

  @Cron('*/15 * * * *')
  async fetchTodayHcaptchaStats() {
    this.logger.log('Fetching hCaptcha stats for today.');
    const today = dayjs().format('YYYY-MM-DD');
    const from = today;
    const to = today;

    const { data } = await lastValueFrom(
      this.httpService.get(this.envConfigService.hCaptchaStatsSource, {
        params: {
          start_date: from,
          end_date: to,
          api_key: this.envConfigService.hCaptchaApiKey,
        },
      }),
    );

    const multiplier = today <= '2022-11-30' ? 18 : 9;
    const stats = data[today];
    if (stats) {
      if (stats.served) delete stats.served;
      stats.solved *= multiplier;
      await this.cacheManager.set(`${HCAPTCHA_PREFIX}${today}`, stats);
    }

    const currentMonth = dayjs().format('YYYY-MM');
    const daysInMonth = dayjs().daysInMonth();

    const dates = Array.from(
      { length: daysInMonth },
      (_, i) => `${currentMonth}-${String(i + 1).padStart(2, '0')}`,
    );

    const aggregatedStats = await Promise.all(
      dates.map(async (date) => {
        const dailyStats: HcaptchaDailyStats = await this.cacheManager.get(
          `${HCAPTCHA_PREFIX}${date}`,
        );
        return dailyStats || { solved: 0 };
      }),
    ).then((statsArray) =>
      statsArray.reduce(
        (acc, stats) => {
          acc.solved += stats.solved;
          return acc;
        },
        { solved: 0 },
      ),
    );

    await this.cacheManager.set(
      `${HCAPTCHA_PREFIX}${currentMonth}`,
      aggregatedStats,
    );
  }

  @Cron('*/15 * * * *')
  async fetchHmtGeneralStats() {
    this.logger.log('Fetching HMT general stats across multiple networks.');
    const aggregatedStats: HmtGeneralStatsDto = {
      totalHolders: 0,
      totalTransactions: 0,
    };
    for (const network of Object.values(MainnetsId).filter(
      (value) => typeof value === 'number',
    ) as number[]) {
      const statisticsClient = new StatisticsClient(NETWORKS[network]);
      const generalStats = await statisticsClient.getHMTStatistics();
      aggregatedStats.totalHolders += generalStats.totalHolders;
      aggregatedStats.totalTransactions += generalStats.totalTransferCount;
    }

    await this.cacheManager.set(
      this.redisConfigService.hmtGeneralStatsCacheKey,
      aggregatedStats,
    );
  }

  private async isHmtDailyStatsFetched(): Promise<boolean> {
    const data = await this.cacheManager.get<DailyHMTData>(
      `${HMT_PREFIX}${HMT_STATS_START_DATE}`,
    );
    return !!data;
  }

  private async fetchHistoricalHmtStats(): Promise<void> {
    const startDate = dayjs(HMT_STATS_START_DATE);
    await this.fetchAndCacheHmtDailyStats(startDate.format('YYYY-MM-DD'));
  }

  @Cron('*/15 * * * *')
  async fetchHmtDailyStats() {
    const currentDate = dayjs().format('YYYY-MM-DD');
    await this.fetchAndCacheHmtDailyStats(currentDate);
  }

  private async fetchAndCacheHmtDailyStats(date: string) {
    const from = new Date(date);
    const to = new Date(dayjs().format('YYYY-MM-DD'));
    const dailyData: Record<string, CachedHMTData> = {};
    const monthlyData: Record<string, CachedHMTData> = {};

    // Fetch daily data for each network
    await Promise.all(
      (
        Object.values(MainnetsId).filter(
          (value) => typeof value === 'number',
        ) as number[]
      ).map(async (network) => {
        const statisticsClient = new StatisticsClient(NETWORKS[network]);
        let skip = 0;
        let fetchedRecords: DailyHMTData[] = [];

        do {
          fetchedRecords = await statisticsClient.getHMTDailyData({
            from,
            to,
            first: 1000, // Max subgraph query size
            skip,
          });

          for (const record of fetchedRecords) {
            const dailyCacheKey = `${HMT_PREFIX}${
              record.timestamp.toISOString().split('T')[0]
            }`;

            // Sum daily values
            if (!dailyData[dailyCacheKey]) {
              dailyData[dailyCacheKey] = {
                totalTransactionAmount: '0',
                totalTransactionCount: 0,
                dailyUniqueSenders: 0,
                dailyUniqueReceivers: 0,
              };
            }

            dailyData[dailyCacheKey].totalTransactionAmount = (
              BigInt(dailyData[dailyCacheKey].totalTransactionAmount) +
              BigInt(record.totalTransactionAmount)
            ).toString();
            dailyData[dailyCacheKey].totalTransactionCount +=
              record.totalTransactionCount;
            dailyData[dailyCacheKey].dailyUniqueSenders +=
              record.dailyUniqueSenders;
            dailyData[dailyCacheKey].dailyUniqueReceivers +=
              record.dailyUniqueReceivers;

            // Sum monthly values
            const month = dayjs(record.timestamp).format('YYYY-MM');
            if (!monthlyData[month]) {
              monthlyData[month] = {
                totalTransactionAmount: '0',
                totalTransactionCount: 0,
                dailyUniqueSenders: 0,
                dailyUniqueReceivers: 0,
              };
            }

            monthlyData[month].totalTransactionAmount = (
              BigInt(monthlyData[month].totalTransactionAmount) +
              BigInt(record.totalTransactionAmount)
            ).toString();
            monthlyData[month].totalTransactionCount +=
              record.totalTransactionCount;
            monthlyData[month].dailyUniqueSenders += record.dailyUniqueSenders;
            monthlyData[month].dailyUniqueReceivers +=
              record.dailyUniqueReceivers;
          }

          skip += 1000;
        } while (fetchedRecords.length === 1000);
      }),
    );

    // Store daily records
    for (const [dailyCacheKey, stats] of Object.entries(dailyData)) {
      await this.cacheManager.set(dailyCacheKey, stats);
    }

    // Store monthly records
    for (const [month, stats] of Object.entries(monthlyData)) {
      const monthlyCacheKey = `${HMT_PREFIX}${month}`;
      await this.cacheManager.set(monthlyCacheKey, stats);
    }
  }

  public async hmtPrice(): Promise<number> {
    const cachedHmtPrice: number = await this.cacheManager.get<number>(
      this.redisConfigService.hmtPriceCacheKey,
    );
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
    await this.cacheManager.set(
      this.redisConfigService.hmtPriceCacheKey,
      hmtPrice,
      this.redisConfigService.cacheHmtPriceTTL,
    );
    return hmtPrice;
  }

  public async hCaptchaStats(
    from: string,
    to: string,
  ): Promise<HcaptchaDailyStats[]> {
    let startDate = dayjs(from);
    const endDate = dayjs(to);
    const dates = [];

    while (startDate <= endDate) {
      dates.push(startDate.format('YYYY-MM-DD'));
      startDate = startDate.add(1, 'day');
    }

    const stats = await Promise.all(
      dates.map(async (date) => {
        const stat: HcaptchaDailyStats = await this.cacheManager.get(
          `${HCAPTCHA_PREFIX}${date}`,
        );
        if (stat) {
          stat.date = date;
        }
        return stat;
      }),
    );

    return stats.filter((stat): stat is HcaptchaDailyStats => stat !== null);
  }

  public async hCaptchaGeneralStats(): Promise<HcaptchaStats> {
    let startDate = dayjs(HCAPTCHA_STATS_START_DATE);
    const currentDate = dayjs();
    const dates = [];

    while (startDate <= currentDate) {
      dates.push(startDate.format('YYYY-MM'));
      startDate = startDate.add(1, 'month');
    }

    const stats = await Promise.all(
      dates.map(async (date) => {
        const stat: HcaptchaStats = await this.cacheManager.get<HcaptchaStats>(
          `${HCAPTCHA_PREFIX}${date}`,
        );
        return stat;
      }),
    );

    const aggregatedStats: HcaptchaStats = stats.reduce((acc, stat) => {
      if (stat) {
        acc.solved += stat.solved;
      }
      return acc;
    });

    return aggregatedStats;
  }

  public async hmtGeneralStats(): Promise<HmtGeneralStatsDto> {
    const data = await this.cacheManager.get<HmtGeneralStatsDto>(
      this.redisConfigService.hmtGeneralStatsCacheKey,
    );

    return data;
  }

  public async hmtDailyStats(
    from: string,
    to: string,
  ): Promise<HmtDailyStatsData[]> {
    let startDate = dayjs(from);
    const endDate = dayjs(to);
    const dates = [];

    while (startDate <= endDate) {
      dates.push(startDate.format('YYYY-MM-DD'));
      startDate = startDate.add(1, 'day');
    }

    const stats = await Promise.all(
      dates.map(async (date) => {
        const stat: HmtDailyStatsData = await this.cacheManager.get(
          `${HMT_PREFIX}${date}`,
        );
        if (stat) {
          stat.date = date;
        }
        return stat;
      }),
    );

    return stats.filter((stat): stat is HmtDailyStatsData => stat !== null);
  }

  public async getAvailableNetworks(): Promise<ChainId[]> {
    const cachedNetworks = await this.cacheManager.get<ChainId[]>(
      this.redisConfigService.availableNetworksCacheKey,
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

    for (const networkKey of Object.values(MainnetsId)) {
      const chainId = MainnetsId[networkKey as keyof typeof MainnetsId];

      const networkConfig = NETWORKS[chainId];

      if (!networkConfig) {
        continue;
      }

      const statisticsClient = new StatisticsClient(networkConfig);

      try {
        const hmtData = await statisticsClient.getHMTDailyData({
          from: new Date(Math.floor(filterDate.getTime() / 1000) * 1000),
        });
        const escrowStats = await statisticsClient.getEscrowStatistics({
          from: new Date(Math.floor(oneMonthAgo.getTime() / 1000) * 1000),
        });

        // Calculate total HMT transaction count across the period
        const totalTransactionCount = hmtData.reduce(
          (sum, day) => sum + day.totalTransactionCount,
          0,
        );

        // At least 1 escrow created in the last month
        const recentEscrowsCreated = escrowStats.totalEscrows > 0;
        // Total HMT transactions > MINIMUM_HMT_TRANSFERS in the last X months
        const sufficientHMTTransfers =
          totalTransactionCount > MINIMUM_HMT_TRANSFERS;

        if (recentEscrowsCreated && sufficientHMTTransfers) {
          availableNetworks.push(chainId);
        }
      } catch (error) {
        this.logger.error(
          `Error processing network ${networkKey} (Chain ID: ${chainId}): ${error.message}`,
        );
      }
    }

    await this.cacheManager.set(
      this.redisConfigService.availableNetworksCacheKey,
      availableNetworks,
      this.envConfigService.networkAvailableCacheTtl,
    );
    return availableNetworks;
  }
}
