import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { StatsService } from './stats.service';
import { JobRepository } from '../job/job.repository';
import { AssignmentRepository } from '../assignment/assignment.repository';

jest.mock('../../common/utils/signature');

describe('statsService', () => {
  let statsService: StatsService;
  let jobRepository: JobRepository;
  let assignmentRepository: AssignmentRepository;
  const userAddress = '0x1234567890123456789012345678901234567890';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [],
      controllers: [StatsService],
      providers: [
        {
          provide: JobRepository,
          useValue: createMock<JobRepository>(),
        },
        {
          provide: AssignmentRepository,
          useValue: createMock<AssignmentRepository>(),
        },
      ],
    }).compile();

    statsService = moduleRef.get<StatsService>(StatsService);
    jobRepository = moduleRef.get<JobRepository>(JobRepository);
    assignmentRepository =
      moduleRef.get<AssignmentRepository>(AssignmentRepository);
  });

  describe('getOracleStats', () => {
    it('should call assignmentRepository', async () => {
      await statsService.getOracleStats();
      expect(jobRepository.countJobsByStatus).toHaveBeenCalledTimes(3);
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
