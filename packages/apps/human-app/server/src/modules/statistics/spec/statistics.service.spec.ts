import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { StatisticsService } from '../statistics.service';
import { CommonHttpUtilService } from '../../../common/utils/common-http-util.service';
import {
  EnvironmentConfigService,
  envValidator,
} from '../../../common/config/environment-config.service';
import { CommonConfigModule } from '../../../common/config/common-config.module';
import { ConfigModule } from '@nestjs/config';
import { CommonUtilModule } from '../../../common/utils/common-util.module';
import { mockCommonHttpUtilService } from '../../../common/utils/common-http-util.service.mock';
import {
  oracleStatsCommandFixture,
  oracleStatsResponseFixture,
  userStatsCommandFixture,
  userStatsResponseFixture,
} from './statistics.fixtures';

describe('StatisticsService', () => {
  let service: StatisticsService;
  let cacheManager: Cache;
  let httpUtilService: CommonHttpUtilService;
  let configService: EnvironmentConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CommonConfigModule,
        CommonUtilModule,
        ConfigModule.forRoot({
          envFilePath: '.env',
          isGlobal: true,
          validationSchema: envValidator,
        }),
      ],
      providers: [
        StatisticsService,
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
            cacheTtlOracleStats: 43200,
            cacheTtlUserStats: 900,
          },
        },
      ],
    })
      .overrideProvider(CommonHttpUtilService)
      .useValue(mockCommonHttpUtilService)
      .compile();

    service = module.get<StatisticsService>(StatisticsService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    httpUtilService = module.get<CommonHttpUtilService>(CommonHttpUtilService);
    configService = module.get<EnvironmentConfigService>(
      EnvironmentConfigService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear all mocks after each test
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOracleStats', () => {
    it('should return cached data if available', async () => {
      const cachedData = oracleStatsResponseFixture;
      jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedData);

      const command = oracleStatsCommandFixture;
      const result = await service.getOracleStats(command);

      expect(cacheManager.get).toHaveBeenCalledWith(command.oracle_url);
      expect(
        httpUtilService.callExternalHttpUtilRequest,
      ).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });

    it('should cache and return new data if not cached', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);
      const newStats = oracleStatsResponseFixture;
      jest
        .spyOn(httpUtilService, 'callExternalHttpUtilRequest')
        .mockResolvedValue(newStats);

      const command = oracleStatsCommandFixture;
      const result = await service.getOracleStats(command);

      expect(cacheManager.get).toHaveBeenCalledWith(command.oracle_url);
      expect(httpUtilService.callExternalHttpUtilRequest).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledWith(
        command.oracle_url,
        newStats,
        configService.cacheTtlOracleStats,
      );
      expect(result).toEqual(newStats);
    });
  });
  describe('getUserStats', () => {
    it('should return cached data if available', async () => {
      const cachedData = userStatsResponseFixture;
      jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedData);

      const command = userStatsCommandFixture;
      const result = await service.getUserStats(command);

      expect(cacheManager.get).toHaveBeenCalledWith(
        command.oracle_url + command.token,
      );
      expect(
        httpUtilService.callExternalHttpUtilRequest,
      ).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });

    it('should cache and return new data if not cached', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);
      const newStats = userStatsResponseFixture;
      jest
        .spyOn(httpUtilService, 'callExternalHttpUtilRequest')
        .mockResolvedValue(newStats);

      const command = userStatsCommandFixture;
      const result = await service.getOracleStats(command);

      expect(cacheManager.get).toHaveBeenCalledWith(command.oracle_url);
      expect(httpUtilService.callExternalHttpUtilRequest).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledWith(
        command.oracle_url,
        newStats,
        configService.cacheTtlOracleStats,
      );
      expect(result).toEqual(newStats);
    });
  });
});
