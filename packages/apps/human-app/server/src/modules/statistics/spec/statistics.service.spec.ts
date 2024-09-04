import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { exchangeOracleGatewayMock } from '../../../integrations/exchange-oracle/spec/exchange-oracle.gateway.mock';
import { StatisticsService } from '../statistics.service';
import { ExchangeOracleGateway } from '../../../integrations/exchange-oracle/exchange-oracle.gateway';
import { EnvironmentConfigService } from '../../../common/config/environment-config.service';
import { Cache } from 'cache-manager';
import { UserStatisticsCommand } from '../model/user-statistics.model';
import { OracleStatisticsResponse } from '../model/oracle-statistics.model';
import {
  ORACLE_STATISTICS_CACHE_KEY,
  WORKER_STATISTICS_CACHE_KEY,
} from '../../../common/constants/cache';
const EXCHANGE_ORACLE_ADDRESS = '0x8f238b21aa2056';
const WALLET_ADDRESS = '0x3df51d';
const TOKEN = 'token1';
describe('StatisticsService', () => {
  let service: StatisticsService;
  let cacheManager: Cache & { get: jest.Mock; set: jest.Mock }; // Explicitly type as jest.Mock
  let exchangeGateway: ExchangeOracleGateway & {
    fetchOracleStatistics: jest.Mock;
    fetchUserStatistics: jest.Mock;
  };
  let configService: EnvironmentConfigService;

  beforeEach(async () => {
    const cacheManagerMock = {
      get: jest.fn(),
      set: jest.fn(),
    };
    const configServiceMock = {
      cacheTtlOracleStats: 300,
      cacheTtlUserStats: 300,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        { provide: CACHE_MANAGER, useValue: cacheManagerMock },
        { provide: ExchangeOracleGateway, useValue: exchangeOracleGatewayMock },
        { provide: EnvironmentConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
    cacheManager = module.get(CACHE_MANAGER);
    exchangeGateway = module.get(ExchangeOracleGateway);
    configService = module.get(EnvironmentConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOracleStats', () => {
    const command = { oracleAddress: EXCHANGE_ORACLE_ADDRESS };
    const cacheKey = `${ORACLE_STATISTICS_CACHE_KEY}:${command.oracleAddress}`;
    it('should return cached data if available', async () => {
      const cachedData = { some: 'data' };
      cacheManager.get.mockResolvedValue(cachedData);

      const result: OracleStatisticsResponse =
        await service.getOracleStats(command);

      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(result).toEqual(cachedData);
      expect(exchangeGateway.fetchOracleStatistics).not.toHaveBeenCalled();
    });

    it('should fetch, cache, and return new data if not in cache', async () => {
      const newData = { newData: 'data' };
      cacheManager.get.mockResolvedValue(undefined);
      exchangeGateway.fetchOracleStatistics.mockResolvedValue(newData);

      const result = await service.getOracleStats(command);

      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(exchangeGateway.fetchOracleStatistics).toHaveBeenCalledWith(
        command,
      );
      expect(cacheManager.set).toHaveBeenCalledWith(cacheKey, newData, {
        ttl: configService.cacheTtlOracleStats,
      });

      expect(result).toEqual(newData);
    });
  });

  describe('getUserStats', () => {
    const userCacheKey = `${WORKER_STATISTICS_CACHE_KEY}:${EXCHANGE_ORACLE_ADDRESS}:${WALLET_ADDRESS}`;
    it('should return cached data if available', async () => {
      const cachedData = { userData: 'data' };
      cacheManager.get.mockResolvedValue(cachedData);

      const command = {
        oracleAddress: EXCHANGE_ORACLE_ADDRESS,
        token: TOKEN,
        walletAddress: WALLET_ADDRESS,
      };
      const result = await service.getUserStats(command);

      expect(cacheManager.get).toHaveBeenCalledWith(userCacheKey);
      expect(result).toEqual(cachedData);
      expect(exchangeGateway.fetchUserStatistics).not.toHaveBeenCalled();
    });

    it('should fetch, cache, and return new data if not in cache', async () => {
      const newData = { newData: 'data' };
      cacheManager.get.mockResolvedValue(undefined);
      exchangeGateway.fetchUserStatistics.mockResolvedValue(newData);

      const command = {
        oracleAddress: EXCHANGE_ORACLE_ADDRESS,
        token: TOKEN,
        walletAddress: WALLET_ADDRESS,
      } as UserStatisticsCommand;
      const result = await service.getUserStats(command);
      expect(cacheManager.get).toHaveBeenCalledWith(userCacheKey);
      expect(exchangeGateway.fetchUserStatistics).toHaveBeenCalledWith(command);
      expect(cacheManager.set).toHaveBeenCalledWith(userCacheKey, newData, {
        ttl: configService.cacheTtlUserStats,
      });
      expect(result).toEqual(newData);
    });
  });
});
