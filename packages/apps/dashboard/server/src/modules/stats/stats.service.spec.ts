import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Logger } from '@nestjs/common';
import { StatisticsClient } from '@human-protocol/sdk';
import { StatsService } from './stats.service';
import { EnvironmentConfigService } from '../../common/config/env-config.service';
import { RedisConfigService } from '../../common/config/redis-config.service';
import { StorageService } from '../storage/storage.service';
import { ChainId, NETWORKS } from '@human-protocol/sdk';
import { MainnetsId } from '../../common/utils/constants';
import { HttpService } from '@nestjs/axios';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  StatisticsClient: jest.fn(),
}));

describe('StatsService', () => {
  let statsService: StatsService;
  let cacheManager: Cache;
  let envConfigService: EnvironmentConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        { provide: HttpService, useValue: createMock<HttpService>() },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: EnvironmentConfigService,
          useValue: {
            networkUsageFilterMonths: 3,
            networkAvailableCacheTtl: 1000,
          },
        },
        {
          provide: RedisConfigService,
          useValue: {
            availableNetworksCacheKey: 'test-available-networks',
          },
        },
        {
          provide: StorageService,
          useValue: {},
        },
        Logger,
      ],
    }).compile();

    statsService = module.get<StatsService>(StatsService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    envConfigService = module.get<EnvironmentConfigService>(
      EnvironmentConfigService,
    );
  });

  it('should regenerate network list when cache TTL expires', async () => {
    const mockNetworkList = [
      ChainId.MAINNET,
      ChainId.BSC_MAINNET,
      ChainId.POLYGON,
      ChainId.XLAYER,
      ChainId.MOONBEAM,
      ChainId.CELO,
      ChainId.AVALANCHE,
    ];

    // Step 1: Initial request - populate cache
    jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
    jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

    const mockStatisticsClient = {
      getHMTDailyData: jest
        .fn()
        .mockResolvedValue([{ totalTransactionCount: 7 }]),
      getEscrowStatistics: jest.fn().mockResolvedValue({ totalEscrows: 1 }),
    };
    (StatisticsClient as jest.Mock).mockImplementation(
      () => mockStatisticsClient,
    );

    // First call should populate cache
    const firstCallResult = await statsService.getAvailableNetworks();

    expect(firstCallResult).toEqual(mockNetworkList);
    expect(cacheManager.set).toHaveBeenCalledWith(
      'test-available-networks',
      mockNetworkList,
      1000,
    );

    // Step 2: Simulate TTL expiration by returning null from cache
    jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(null);

    // Second call after TTL should re-generate the network list
    const secondCallResult = await statsService.getAvailableNetworks();
    expect(secondCallResult).toEqual(mockNetworkList);

    // Ensure the cache is set again with the regenerated network list
    expect(cacheManager.set).toHaveBeenCalledWith(
      'test-available-networks',
      mockNetworkList,
      1000,
    );
  });

  it('should return cached networks if available', async () => {
    const cachedNetworks = [ChainId.MAINNET, ChainId.POLYGON];
    jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedNetworks);

    const result = await statsService.getAvailableNetworks();
    expect(result).toEqual(cachedNetworks);
    expect(cacheManager.get).toHaveBeenCalledWith('test-available-networks');
  });

  it('should fetch and filter available networks correctly', async () => {
    jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
    const mockStatisticsClient = {
      getHMTDailyData: jest
        .fn()
        .mockResolvedValue([
          { totalTransactionCount: 4 },
          { totalTransactionCount: 3 },
        ]),
      getEscrowStatistics: jest.fn().mockResolvedValue({ totalEscrows: 1 }),
    };
    (StatisticsClient as jest.Mock).mockImplementation(
      () => mockStatisticsClient,
    );

    const result = await statsService.getAvailableNetworks();
    expect(result).toEqual(
      expect.arrayContaining([ChainId.MAINNET, ChainId.POLYGON]),
    );

    expect(cacheManager.set).toHaveBeenCalledWith(
      'test-available-networks',
      result,
      1000,
    );
  });

  it('should exclude networks without sufficient HMT transfers', async () => {
    jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
    const mockStatisticsClient = {
      getHMTDailyData: jest
        .fn()
        .mockResolvedValue([{ totalTransactionCount: 2 }]),
      getEscrowStatistics: jest.fn().mockResolvedValue({ totalEscrows: 1 }),
    };
    (StatisticsClient as jest.Mock).mockImplementation(
      () => mockStatisticsClient,
    );

    const result = await statsService.getAvailableNetworks();
    expect(result).toEqual([]);
  });

  it('should handle missing network configuration gracefully', async () => {
    jest.spyOn(cacheManager, 'get').mockResolvedValue(null);

    const originalNetworkConfig = NETWORKS[MainnetsId.MAINNET];
    NETWORKS[MainnetsId.MAINNET] = undefined;

    const mockStatisticsClient = {
      getHMTDailyData: jest
        .fn()
        .mockResolvedValue([
          { totalTransactionCount: 3 },
          { totalTransactionCount: 3 },
        ]),
      getEscrowStatistics: jest.fn().mockResolvedValue({ totalEscrows: 1 }),
    };
    (StatisticsClient as jest.Mock).mockImplementation(
      () => mockStatisticsClient,
    );

    const result = await statsService.getAvailableNetworks();

    expect(result).not.toContain(MainnetsId.MAINNET);
    expect(result).toEqual(expect.arrayContaining([]));

    NETWORKS[MainnetsId.MAINNET] = originalNetworkConfig;
  });

  it('should handle errors in getHMTDailyData gracefully', async () => {
    jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
    const mockStatisticsClient = {
      getHMTDailyData: jest
        .fn()
        .mockRejectedValue(new Error('Failed to fetch HMT data')),
      getEscrowStatistics: jest.fn().mockResolvedValue({ totalEscrows: 1 }),
    };
    (StatisticsClient as jest.Mock).mockImplementation(
      () => mockStatisticsClient,
    );

    const result = await statsService.getAvailableNetworks();
    expect(result).toEqual([]);
  });

  it('should handle errors in getEscrowStatistics gracefully', async () => {
    jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
    const mockStatisticsClient = {
      getHMTDailyData: jest
        .fn()
        .mockResolvedValue([
          { totalTransactionCount: 3 },
          { totalTransactionCount: 2 },
        ]),
      getEscrowStatistics: jest
        .fn()
        .mockRejectedValue(new Error('Failed to fetch escrow stats')),
    };
    (StatisticsClient as jest.Mock).mockImplementation(
      () => mockStatisticsClient,
    );

    const result = await statsService.getAvailableNetworks();
    expect(result).toEqual([]);
  });
});
