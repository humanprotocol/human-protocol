import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsController } from '../statistics.controller';
import { StatisticsService } from '../statistics.service';
import { statisticsServiceMock } from './statistics.service.mock';
import {
  oracleStatsCommandFixture,
  oracleStatsResponseFixture,
  statisticsExchangeOracleAddress,
  statisticsToken,
  userStatsCommandFixture,
  userStatsResponseFixture,
} from './statistics.fixtures';
import { OracleStatisticsDto } from '../model/oracle-statistics.model';
import { UserStatisticsDto } from '../model/user-statistics.model';

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
      const dto: OracleStatisticsDto = {
        oracle_address: statisticsExchangeOracleAddress,
      };
      const result = await controller.getOracleStatistics(dto);

      expect(statisticsServiceMock.getOracleStats).toHaveBeenCalledWith(
        oracleStatsCommandFixture,
      );
      expect(result).toEqual(oracleStatsResponseFixture);
    });
  });

  describe('getUserStatistics', () => {
    it('should call getUserStats service method with correct parameters', async () => {
      const dto: UserStatisticsDto = {
        oracle_address: statisticsExchangeOracleAddress,
      };
      const result = await controller.getUserStatistics(dto, statisticsToken);

      expect(statisticsServiceMock.getUserStats).toHaveBeenCalledWith(
        userStatsCommandFixture,
      );
      expect(result).toEqual(userStatsResponseFixture);
    });
  });
});
