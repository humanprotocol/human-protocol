import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { StatsService } from './stats.service';
import { AssignmentRepository } from '../assignment/assignment.repository';

jest.mock('../../common/utils/signature');

describe('statsService', () => {
  let statsService: StatsService;
  let assignmentRepository: AssignmentRepository;
  const userAddress = '0x1234567890123456789012345678901234567890';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [],
      controllers: [StatsService],
      providers: [
        {
          provide: AssignmentRepository,
          useValue: createMock<AssignmentRepository>(),
        },
      ],
    }).compile();

    statsService = moduleRef.get<StatsService>(StatsService);
    assignmentRepository =
      moduleRef.get<AssignmentRepository>(AssignmentRepository);
  });

  describe('getOracleStats', () => {
    it('should call assignmentRepository', async () => {
      await statsService.getOracleStats();
      expect(assignmentRepository.countTotalWorkers).toHaveBeenCalledWith();
      expect(
        assignmentRepository.countCompletedAssignments,
      ).toHaveBeenCalledWith();
      expect(
        assignmentRepository.countExpiredAssignments,
      ).toHaveBeenCalledWith();
      expect(
        assignmentRepository.countRejectedAssignments,
      ).toHaveBeenCalledWith();
    });
  });

  describe('getAssignmentStats', () => {
    it('should call assignmentR.getAssignmentStats', async () => {
      await statsService.getAssignmentStats(userAddress);
      expect(assignmentRepository.countTotalAssignments).toHaveBeenCalledWith(
        userAddress,
      );
      expect(assignmentRepository.countSentAssignments).toHaveBeenCalledWith(
        userAddress,
      );
      expect(
        assignmentRepository.countCompletedAssignments,
      ).toHaveBeenCalledWith(userAddress);
      expect(assignmentRepository.countExpiredAssignments).toHaveBeenCalledWith(
        userAddress,
      );
      expect(
        assignmentRepository.countRejectedAssignments,
      ).toHaveBeenCalledWith(userAddress);
    });
  });
});
