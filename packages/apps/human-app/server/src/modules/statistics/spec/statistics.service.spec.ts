import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { exchangeOracleGatewayMock } from '../../../integrations/exchange-oracle/spec/exchange-oracle.gateway.mock';
import { StatisticsService } from '../statistics.service';
import { ExchangeOracleGateway } from '../../../integrations/exchange-oracle/exchange-oracle.gateway';
import { EnvironmentConfigService } from '../../../common/config/environment-config.service';
import { Cache } from 'cache-manager';

describe('StatisticsService', () => {
  let service: StatisticsService;
  let cacheManager: Cache & { get: jest.Mock; set: jest.Mock }; // Explicitly type as jest.Mock
  let gateway: ExchangeOracleGateway & {
    fetchOracleStatistics: jest.Mock;
    fetchUserStatistics: jest.Mock;
  }; // Explicitly type as jest.Mock
  let configService: EnvironmentConfigService;
  beforeEach(async () => {
    // Mock the dependencies
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
    gateway = module.get(ExchangeOracleGateway);
    configService = module.get(EnvironmentConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOracleStats', () => {
    it('should return cached data if available', async () => {
      const cachedData = { some: 'data' };
      cacheManager.get.mockResolvedValue(cachedData);

      const command = { exchangeOracleUrl: 'https://example.com' };
      const result = await service.getOracleStats(command);

      expect(cacheManager.get).toHaveBeenCalledWith(command.exchangeOracleUrl);
      expect(result).toEqual(cachedData);
      expect(gateway.fetchOracleStatistics).not.toHaveBeenCalled();
    });

    it('should fetch, cache, and return new data if not in cache', async () => {
      const newData = { newData: 'data' };
      cacheManager.get.mockResolvedValue(undefined);
      gateway.fetchOracleStatistics.mockResolvedValue(newData);

      const command = { exchangeOracleUrl: 'https://example.com' };
      const result = await service.getOracleStats(command);

      expect(cacheManager.get).toHaveBeenCalledWith(command.exchangeOracleUrl);
      expect(gateway.fetchOracleStatistics).toHaveBeenCalledWith(command);
      expect(cacheManager.set).toHaveBeenCalledWith(
        command.exchangeOracleUrl,
        newData,
        configService.cacheTtlOracleStats,
      );
      expect(result).toEqual(newData);
    });
  });

  describe('getUserStats', () => {
    it('should return cached data if available', async () => {
      const cachedData = { userData: 'data' };
      const userCacheKey = 'https://example.comtoken';
      cacheManager.get.mockResolvedValue(cachedData);

      const command = {
        exchangeOracleUrl: 'https://example.com',
        token: 'token',
      };
      const result = await service.getUserStats(command);

      expect(cacheManager.get).toHaveBeenCalledWith(userCacheKey);
      expect(result).toEqual(cachedData);
      expect(gateway.fetchUserStatistics).not.toHaveBeenCalled();
    });

    it('should fetch, cache, and return new data if not in cache', async () => {
      const newData = { newData: 'data' };
      const userCacheKey = 'https://example.comtoken';
      cacheManager.get.mockResolvedValue(undefined);
      gateway.fetchUserStatistics.mockResolvedValue(newData);

      const command = {
        exchangeOracleUrl: 'https://example.com',
        token: 'token',
      };
      const result = await service.getUserStats(command);

      expect(cacheManager.get).toHaveBeenCalledWith(userCacheKey);
      expect(gateway.fetchUserStatistics).toHaveBeenCalledWith(command);
      expect(cacheManager.set).toHaveBeenCalledWith(
        userCacheKey,
        newData,
        configService.cacheTtlUserStats,
      );
      expect(result).toEqual(newData);
    });
  });
});
