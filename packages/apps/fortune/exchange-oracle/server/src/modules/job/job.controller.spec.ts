import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { RequestWithUser } from '../../common/types/jwt';
import { JobController } from './job.controller';
import { GetJobsDto, SolveJobDto, JobDto } from './job.dto';
import { JobService } from './job.service';
import { JobSortField, JobStatus, JobType } from '../../common/enums/job';
import { PageDto } from '../../common/pagination/pagination.dto';
import { AssignmentRepository } from '../assignment/assignment.repository';

jest.mock('../../common/utils/signature');

describe('JobController', () => {
  let jobController: JobController;
  let jobService: JobService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [],
      controllers: [JobController],
      providers: [
        { provide: JobService, useValue: createMock<JobService>() },
        {
          provide: AssignmentRepository,
          useValue: createMock<AssignmentRepository>(),
        },
      ],
    }).compile();

    jobController = moduleRef.get<JobController>(JobController);
    jobService = moduleRef.get<JobService>(JobService);
  });

  describe('getJobs', () => {
    it('should call jobService.getJobList', async () => {
      const getJobsDto: GetJobsDto = {
        sortField: JobSortField.CREATED_AT,
        chainId: 1,
        jobType: JobType.FORTUNE,
        fields: [],
        escrowAddress: '0x1234567890123456789012345678901234567890',
        status: JobStatus.ACTIVE,
        page: 1,
        pageSize: 10,
        skip: 0,
      };

      const req = {
        user: { reputationNetwork: 'network' },
      } as RequestWithUser;

      const pageDto: PageDto<JobDto> = {
        results: [],
        totalResults: 0,
        totalPages: 0,
        pageSize: 10,
        page: 1,
      };

      jest.spyOn(jobService, 'getJobList').mockResolvedValue(pageDto);

      await jobController.getJobs(req, getJobsDto);

      expect(jobService.getJobList).toHaveBeenCalledWith(
        getJobsDto,
        req.user.reputationNetwork,
      );
    });
  });

  describe('solveJob', () => {
    it('should call jobService.solveJob', async () => {
      const solveJobDto: SolveJobDto = {
        assignmentId: '1',
        solution: 'job-solution',
      };

      await jobController.solveJob('signature', solveJobDto);

      expect(jobService.solveJob).toHaveBeenCalledWith(
        Number(solveJobDto.assignmentId),
        solveJobDto.solution,
      );
    });
  });
});
