import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Logger } from '@nestjs/common';
import { StatisticsClient } from '@human-protocol/sdk';
import { EnvironmentConfigService } from '../../common/config/env-config.service';
import { ChainId, NETWORKS } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { NetworksService } from './networks.service';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  StatisticsClient: jest.fn(),
}));

describe('NetworksService', () => {
  let networksService: NetworksService;
  let cacheManager: Cache;

  beforeAll(async () => {
    process.env.RPC_URL_POLYGON = 'https://testrpc.com';
    process.env.RPC_URL_ETHEREUM = 'https://testrpc.com';
    process.env.WEB3_ENV = 'mainnet';
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NetworksService,
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
            networkOperatingCacheTtl: 1000,
          },
        },
        ConfigService,
        Logger,
      ],
    }).compile();

    networksService = module.get<NetworksService>(NetworksService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  it('should regenerate network list when cache TTL expires', async () => {
    const mockNetworkList = [
      ChainId.MAINNET,
      ChainId.BSC_MAINNET,
      ChainId.POLYGON,
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
    const firstCallResult = await networksService.getOperatingNetworks();

    expect(firstCallResult).toEqual(mockNetworkList);
    expect(cacheManager.set).toHaveBeenCalledWith(
      'operating-networks',
      mockNetworkList,
      1000,
    );

    // Step 2: Simulate TTL expiration by returning null from cache
    jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(null);

    // Second call after TTL should re-generate the network list
    const secondCallResult = await networksService.getOperatingNetworks();
    expect(secondCallResult).toEqual(mockNetworkList);

    // Ensure the cache is set again with the regenerated network list
    expect(cacheManager.set).toHaveBeenCalledWith(
      'operating-networks',
      mockNetworkList,
      1000,
    );
  });

  it('should return cached networks if available', async () => {
    const cachedNetworks = [ChainId.MAINNET, ChainId.POLYGON];
    jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedNetworks);

    const result = await networksService.getOperatingNetworks();
    expect(result).toEqual(cachedNetworks);
    expect(cacheManager.get).toHaveBeenCalledWith('operating-networks');
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

    const result = await networksService.getOperatingNetworks();
    expect(result).toEqual(
      expect.arrayContaining([ChainId.MAINNET, ChainId.POLYGON]),
    );

    expect(cacheManager.set).toHaveBeenCalledWith(
      'operating-networks',
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

    const result = await networksService.getOperatingNetworks();
    expect(result).toEqual([]);
  });

  it('should handle missing network configuration gracefully', async () => {
    jest.spyOn(cacheManager, 'get').mockResolvedValue(null);

    const originalNetworkConfig = NETWORKS[ChainId.MAINNET];
    NETWORKS[ChainId.MAINNET] = undefined;

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

    const result = await networksService.getOperatingNetworks();

    expect(result).not.toContain(ChainId.MAINNET);
    expect(result).toEqual(expect.arrayContaining([]));

    NETWORKS[ChainId.MAINNET] = originalNetworkConfig;
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

    const result = await networksService.getOperatingNetworks();
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

    const result = await networksService.getOperatingNetworks();
    expect(result).toEqual([]);
  });
});
