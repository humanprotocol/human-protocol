import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { RequestWithUser } from 'src/common/types/jwt';
import { JobController } from './job.controller';
import { ResignJobDto, SolveJobDto } from './job.dto';
import { JobService } from './job.service';

jest.mock('../../common/utils/signature');

describe('JobController', () => {
  let jobController: JobController;
  let jobService: JobService;

  const chainId = 1;
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
      const solution = 'job-solution';
      const solveJobDto: SolveJobDto = {
        chainId,
        escrowAddress,
        solution,
      };

      jest.spyOn(jobService, 'solveJob').mockResolvedValue();

      await jobController.solveJob(
        {
          user: { address: workerAddress },
        } as RequestWithUser,
        solveJobDto,
      );

      expect(jobService.solveJob).toHaveBeenCalledWith(
        solveJobDto.chainId,
        solveJobDto.escrowAddress,
        workerAddress,
        solveJobDto.solution,
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
      };

      jest.spyOn(jobService, 'solveJob').mockResolvedValue();

      await jobController.solveJob(
        {
          user: { address: workerAddress },
        } as RequestWithUser,
        solveJobDto,
      );

      expect(jobService.solveJob).toHaveBeenCalledWith(
        solveJobDto.chainId,
        solveJobDto.escrowAddress,
        workerAddress,
        solveJobDto.solution,
      );
    });
  });

  describe('resignJob', () => {
    it('should call jobService.resignJob', async () => {
      const assignmentId = 123;
      const resignJobDto: ResignJobDto = {
        assignmentId,
      };

      jest.spyOn(jobService, 'resignJob').mockResolvedValue();

      await jobController.resignJob(
        { user: { address: workerAddress } } as RequestWithUser,
        resignJobDto,
      );

      expect(jobService.resignJob).toHaveBeenCalledWith(
        resignJobDto.assignmentId,
        workerAddress,
      );
    });
  });
});
