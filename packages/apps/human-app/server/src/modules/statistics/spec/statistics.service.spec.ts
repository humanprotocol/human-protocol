import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { exchangeOracleGatewayMock } from '../../../integrations/exchange-oracle/spec/exchange-oracle.gateway.mock';
import { StatisticsService } from '../statistics.service';
import { ExchangeOracleGateway } from '../../../integrations/exchange-oracle/exchange-oracle.gateway';
import { EnvironmentConfigService } from '../../../common/config/environment-config.service';
import { Cache } from 'cache-manager';
import {
  UserStatisticsCommand,
  UserStatisticsDetails,
} from '../model/user-statistics.model';
import { KvStoreGateway } from '../../../integrations/kv-store/kv-store-gateway.service';
import {
  OracleStatisticsCommand,
  OracleStatisticsDetails,
  OracleStatisticsResponse,
} from '../model/oracle-statistics.model';
const EXCHANGE_ORACLE_URL = 'https://exchangeOracle.url';
const EXCHANGE_ORACLE_ADDRESS = '0x8f238b21aa2056';
const TOKEN = 'token1';
describe('StatisticsService', () => {
  let service: StatisticsService;
  let cacheManager: Cache & { get: jest.Mock; set: jest.Mock }; // Explicitly type as jest.Mock
  let exchangeGateway: ExchangeOracleGateway & {
    fetchOracleStatistics: jest.Mock;
    fetchUserStatistics: jest.Mock;
  };
  let configService: EnvironmentConfigService;
  let kvStoreGateway: KvStoreGateway;

  beforeEach(async () => {
    const cacheManagerMock = {
      get: jest.fn(),
      set: jest.fn(),
    };
    const configServiceMock = {
      cacheTtlOracleStats: 300,
      cacheTtlUserStats: 300,
    };
    const kvStoreGatewayMock = {
      getExchangeOracleUrlByAddress: jest
        .fn()
        .mockResolvedValue(EXCHANGE_ORACLE_URL),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        { provide: KvStoreGateway, useValue: kvStoreGatewayMock },
        { provide: CACHE_MANAGER, useValue: cacheManagerMock },
        { provide: ExchangeOracleGateway, useValue: exchangeOracleGatewayMock },
        { provide: EnvironmentConfigService, useValue: configServiceMock },
      ],
    }).compile();

    kvStoreGateway = module.get<KvStoreGateway>(KvStoreGateway);
    service = module.get<StatisticsService>(StatisticsService);
    cacheManager = module.get(CACHE_MANAGER);
    exchangeGateway = module.get(ExchangeOracleGateway);
    configService = module.get(EnvironmentConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOracleStats', () => {
    it('should return cached data if available', async () => {
      const cachedData = { some: 'data' };
      cacheManager.get.mockResolvedValue(cachedData);

      const command: OracleStatisticsCommand = {
        oracleAddress: EXCHANGE_ORACLE_ADDRESS,
      };
      const result: OracleStatisticsResponse =
        await service.getOracleStats(command);

      expect(cacheManager.get).toHaveBeenCalledWith(command.oracleAddress);
      expect(result).toEqual(cachedData);
      expect(exchangeGateway.fetchOracleStatistics).not.toHaveBeenCalled();
    });

    it('should fetch, cache, and return new data if not in cache', async () => {
      const newData = { newData: 'data' };
      cacheManager.get.mockResolvedValue(undefined);
      exchangeGateway.fetchOracleStatistics.mockResolvedValue(newData);

      const command = { oracleAddress: EXCHANGE_ORACLE_ADDRESS };
      const result = await service.getOracleStats(command);
      const details: OracleStatisticsDetails = {
        exchangeOracleUrl: EXCHANGE_ORACLE_URL,
      };

      expect(kvStoreGateway.getExchangeOracleUrlByAddress).toHaveBeenCalledWith(
        command.oracleAddress,
      );
      expect(cacheManager.get).toHaveBeenCalledWith(command.oracleAddress);
      expect(exchangeGateway.fetchOracleStatistics).toHaveBeenCalledWith(
        details,
      );
      expect(cacheManager.set).toHaveBeenCalledWith(
        command.oracleAddress,
        newData,
        configService.cacheTtlOracleStats,
      );
      expect(result).toEqual(newData);
    });
  });

  describe('getUserStats', () => {
    it('should return cached data if available', async () => {
      const cachedData = { userData: 'data' };
      const userCacheKey = EXCHANGE_ORACLE_ADDRESS + TOKEN;
      cacheManager.get.mockResolvedValue(cachedData);

      const command = {
        oracleAddress: EXCHANGE_ORACLE_ADDRESS,
        token: TOKEN,
      };
      const result = await service.getUserStats(command);

      expect(cacheManager.get).toHaveBeenCalledWith(userCacheKey);
      expect(result).toEqual(cachedData);
      expect(exchangeGateway.fetchUserStatistics).not.toHaveBeenCalled();
    });

    it('should fetch, cache, and return new data if not in cache', async () => {
      const newData = { newData: 'data' };
      const userCacheKey = EXCHANGE_ORACLE_ADDRESS + TOKEN;
      cacheManager.get.mockResolvedValue(undefined);
      exchangeGateway.fetchUserStatistics.mockResolvedValue(newData);

      const command = {
        oracleAddress: EXCHANGE_ORACLE_ADDRESS,
        token: TOKEN,
      } as UserStatisticsCommand;
      const details = {
        exchangeOracleUrl: EXCHANGE_ORACLE_URL,
        token: TOKEN,
      } as UserStatisticsDetails;
      const result = await service.getUserStats(command);
      expect(kvStoreGateway.getExchangeOracleUrlByAddress).toHaveBeenCalledWith(
        command.oracleAddress,
      );
      expect(cacheManager.get).toHaveBeenCalledWith(userCacheKey);
      expect(exchangeGateway.fetchUserStatistics).toHaveBeenCalledWith(details);
      expect(cacheManager.set).toHaveBeenCalledWith(
        userCacheKey,
        newData,
        configService.cacheTtlUserStats,
      );
      expect(result).toEqual(newData);
    });
  });
});
