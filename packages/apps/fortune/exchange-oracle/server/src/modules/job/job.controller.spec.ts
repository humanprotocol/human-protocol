import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { RequestWithUser } from 'src/common/types/jwt';
import { JobController } from './job.controller';
import { GetJobsDto, SolveJobDto, JobDto } from './job.dto';
import { JobService } from './job.service';
import { JobSortField, JobStatus, JobType } from '../../common/enums/job';
import { PageDto } from '../../common/pagination/pagination.dto';

jest.mock('../../common/utils/signature');

describe('JobController', () => {
  let jobController: JobController;
  let jobService: JobService;

  const chainId = 1;
  const assignmentId = '1';
  const signature = 'human-signature';
  const escrowAddress = '0x1234567890123456789012345678901234567890';
  const workerAddress = '0x1234567890123456789012345678901234567891';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [],
      controllers: [JobController],
      providers: [{ provide: JobService, useValue: createMock<JobService>() }],
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
      const solution = 'job-solution';
      const solveJobDto: SolveJobDto = {
        chainId,
        escrowAddress,
        solution,
        assignmentId,
      };

      jest.spyOn(jobService, 'solveJob').mockResolvedValue();

      await jobController.solveJob(
        {
          user: { address: workerAddress },
        } as RequestWithUser,
        signature,
        solveJobDto,
      );

      expect(jobService.solveJob).toHaveBeenCalledWith(
        solveJobDto.chainId,
        solveJobDto.escrowAddress,
        solveJobDto.assignmentId,
        solveJobDto.solution,
      );
    });
  });
});
