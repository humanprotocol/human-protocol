import { Test } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { StatisticService } from './statistic.service';
import {
  JobStatusPerDayDto,
  JobCountDto,
  FundAmountStatisticsDto,
  JobStatisticsDto,
} from './statistic.dto';
import { JobRepository } from '../job/job.repository';

describe('StatisticService', () => {
  let statisticService: StatisticService;
  let jobRepository: JobRepository;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        StatisticService,
        {
          provide: JobRepository,
          useValue: createMock<JobRepository>(),
        },
      ],
    }).compile();

    statisticService = moduleRef.get<StatisticService>(StatisticService);
    jobRepository = moduleRef.get<JobRepository>(JobRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllJobStatistics', () => {
    it('should return all job statistics', async () => {
      const mockAverageCompletionTime = 10;
      const mockFundAmountStats: FundAmountStatisticsDto = {
        average: 1000,
        maximum: 2000,
        minimum: 500,
      };
      const mockJobCounts: JobCountDto = {
        totalJobs: 100,
        launched: 60,
        partial: 20,
        completed: 15,
        canceled: 5,
      };
      const mockLaunchedJobsPerDay: JobStatusPerDayDto[] = [
        {
          date: '2023-01-01',
          launched: 5,
          partial: 0,
          completed: 0,
          canceled: 0,
        },
      ];
      const mockJobsByStatusPerDay: JobStatusPerDayDto[] = [
        {
          date: '2023-01-01',
          launched: 0,
          partial: 2,
          completed: 1,
          canceled: 1,
        },
      ];

      jest
        .spyOn(jobRepository, 'getAverageCompletionTime')
        .mockResolvedValue(mockAverageCompletionTime);
      jest
        .spyOn(jobRepository, 'getFundAmountStats')
        .mockResolvedValue(mockFundAmountStats);
      jest
        .spyOn(jobRepository, 'getGlobalJobCounts')
        .mockResolvedValue(mockJobCounts);
      jest
        .spyOn(jobRepository, 'getLaunchedJobsPerDay')
        .mockResolvedValue(mockLaunchedJobsPerDay);
      jest
        .spyOn(jobRepository, 'getJobsByStatusPerDay')
        .mockResolvedValue(mockJobsByStatusPerDay);

      const expectedStatistics: JobStatisticsDto = {
        averageCompletionTime: mockAverageCompletionTime,
        jobCounts: mockJobCounts,
        fundAmountStats: mockFundAmountStats,
        jobsByStatusPerDay: [
          {
            date: '2023-01-01',
            launched: 5,
            partial: 2,
            completed: 1,
            canceled: 1,
          },
        ],
      };

      const result = await statisticService.getAllJobStatistics();
      expect(result).toEqual(expectedStatistics);
    });
  });

  describe('combineJobStatusesPerDay', () => {
    it('should combine job statuses per day correctly', () => {
      const launchedJobsPerDay: JobStatusPerDayDto[] = [
        {
          date: '2023-01-01',
          launched: 5,
          partial: 0,
          completed: 0,
          canceled: 0,
        },
      ];
      const jobsByStatusPerDay: JobStatusPerDayDto[] = [
        {
          date: '2023-01-01',
          launched: 0,
          partial: 2,
          completed: 1,
          canceled: 1,
        },
      ];

      const expectedCombined: JobStatusPerDayDto[] = [
        {
          date: '2023-01-01',
          launched: 5,
          partial: 2,
          completed: 1,
          canceled: 1,
        },
      ];

      const result = (statisticService as any).combineJobStatusesPerDay(
        launchedJobsPerDay,
        jobsByStatusPerDay,
      );
      expect(result).toEqual(expectedCombined);
    });

    it('should handle dates that are only in one of the arrays', () => {
      const launchedJobsPerDay: JobStatusPerDayDto[] = [
        {
          date: '2023-01-01',
          launched: 5,
          partial: 0,
          completed: 0,
          canceled: 0,
        },
      ];
      const jobsByStatusPerDay: JobStatusPerDayDto[] = [
        {
          date: '2023-01-02',
          launched: 0,
          partial: 2,
          completed: 1,
          canceled: 1,
        },
      ];

      const expectedCombined: JobStatusPerDayDto[] = [
        {
          date: '2023-01-01',
          launched: 5,
          partial: 0,
          completed: 0,
          canceled: 0,
        },
        {
          date: '2023-01-02',
          launched: 0,
          partial: 2,
          completed: 1,
          canceled: 1,
        },
      ];

      const result = (statisticService as any).combineJobStatusesPerDay(
        launchedJobsPerDay,
        jobsByStatusPerDay,
      );
      expect(result).toEqual(expectedCombined);
    });
  });
});
