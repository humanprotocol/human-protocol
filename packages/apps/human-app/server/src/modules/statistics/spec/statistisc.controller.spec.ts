import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsController } from '../statistics.controller';
import { StatisticsService } from '../statistics.service';
import { statisticsServiceMock } from './statistics.service.mock';
import {
  oracleStatsResponseFixture,
  userStatsResponseFixture,
} from './statistics.fixtures';

describe('StatisticsController', () => {
  let controller: StatisticsController;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatisticsController],
      providers: [StatisticsService],
    })
      .overrideProvider(StatisticsService)
      .useValue(statisticsServiceMock)
      .compile();

    controller = module.get<StatisticsController>(StatisticsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getOracleStatistics', () => {
    it('should call getOracleStats service method with correct parameters', async () => {
      const oracleUrl = 'http://test-oracle.com';
      const result = await controller.getOracleStatistics(oracleUrl);

      expect(statisticsServiceMock.getOracleStats).toHaveBeenCalledWith({
        oracle_url: oracleUrl,
      });
      expect(result).toEqual(oracleStatsResponseFixture);
    });
  });

  describe('getUserStatistics', () => {
    it('should call getUserStats service method with correct parameters', async () => {
      const oracleUrl = 'http://test-user.com';
      const result = await controller.getUserStatistics(oracleUrl);

      expect(statisticsServiceMock.getUserStats).toHaveBeenCalledWith({
        oracle_url: oracleUrl,
      });
      expect(result).toEqual(userStatsResponseFixture);
    });
  });
});
