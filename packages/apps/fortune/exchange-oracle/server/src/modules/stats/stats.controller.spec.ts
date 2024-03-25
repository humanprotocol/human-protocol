import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { AssignmentStatsDto, OracleStatsDto } from './stats.dto';
import { RequestWithUser } from '../../common/types/jwt';

jest.mock('../../common/utils/signature');

describe('statsController', () => {
  let statsController: StatsController;
  let statsService: StatsService;
  const userAddress = '0x1234567890123456789012345678901234567890';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [],
      controllers: [StatsController],
      providers: [
        { provide: StatsService, useValue: createMock<StatsService>() },
      ],
    }).compile();

    statsController = moduleRef.get<StatsController>(StatsController);
    statsService = moduleRef.get<StatsService>(StatsService);
  });

  describe('processWebhook', () => {
    it('should call statsService.getOracleStats', async () => {
      const stats = new OracleStatsDto();
      jest.spyOn(statsService, 'getOracleStats').mockResolvedValue(stats);
      const result = await statsController.getOracleStats();
      expect(result).toBe(stats);
      expect(statsService.getOracleStats).toHaveBeenCalledWith();
    });

    it('should call statsService.getAssignmentStats', async () => {
      const stats = new AssignmentStatsDto();
      jest.spyOn(statsService, 'getAssignmentStats').mockResolvedValue(stats);
      const result = await statsController.getAssignmentStats({
        user: { address: userAddress },
      } as RequestWithUser);
      expect(result).toBe(stats);
      expect(statsService.getAssignmentStats).toHaveBeenCalledWith(userAddress);
    });
  });
});
