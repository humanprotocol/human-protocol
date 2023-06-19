import { Test } from '@nestjs/testing';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { JobDetailsDto, SolveJobDto } from './job.dto';
import { Web3Service } from '../web3/web3.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

describe('JobController', () => {
  let jobController: JobController;
  let jobService: JobService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [JobController],
      providers: [
        JobService,
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue({
              address: '0xsigneraddress',
              getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
            }),
          },
        },
        {
          provide: HttpService,
          useValue: {
            post: jest.fn().mockReturnValue(of({ status: 200, data: {} })),
          },
        },
      ],
    }).compile();

    jobController = moduleRef.get<JobController>(JobController);
    jobService = moduleRef.get<JobService>(JobService);
  });

  describe('getDetails', () => {
    it('should return job details', async () => {
      const chainId = 1;
      const escrowAddress = '0x123abc';
      const expectedDetails: JobDetailsDto = {
        escrowAddress,
        chainId,
        manifest: {
          title: 'Example Title',
          description: 'Example Description',
          fortunesRequested: 5,
          fundAmount: 100,
        },
      };

      jest.spyOn(jobService, 'getDetails').mockResolvedValue(expectedDetails);

      const result = await jobController.getDetails(chainId, escrowAddress);

      expect(result).toBe(expectedDetails);
      expect(jobService.getDetails).toHaveBeenCalledWith(
        chainId,
        escrowAddress,
      );
    });
  });

  describe('getPendingJobs', () => {
    it('should return pending jobs', async () => {
      const chainId = 1;
      const workerAddress = '0x456def';
      const expectedJobs: any[] = ['0xescrowaddress1', '0xescrowaddress2'];

      jest.spyOn(jobService, 'getPendingJobs').mockResolvedValue(expectedJobs);

      const result = await jobController.getPendingJobs(chainId, workerAddress);

      expect(result).toBe(expectedJobs);
      expect(jobService.getPendingJobs).toHaveBeenCalledWith(
        chainId,
        workerAddress,
      );
    });
  });

  describe('solveJob', () => {
    it('should solve a job', async () => {
      const chainId = 1;
      const escrowAddress = '0xescrowaddress';
      const workerAddress = '0xworkeraddress';
      const solution = 'job-solution';
      const solveJobDto: SolveJobDto = {
        chainId,
        escrowAddress,
        workerAddress,
        solution,
      };
      const expectedResult = true;

      jest.spyOn(jobService, 'solveJob').mockResolvedValue(expectedResult);

      const result = await jobController.solveJob(solveJobDto);

      expect(result).toBe(expectedResult);
      expect(jobService.solveJob).toHaveBeenCalledWith(
        solveJobDto.chainId,
        solveJobDto.escrowAddress,
        solveJobDto.workerAddress,
        solveJobDto.solution,
      );
    });
  });
});
