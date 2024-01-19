import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { JobDetailsDto, SolveJobDto, WebhookDto } from './job.dto';
import { Web3Service } from '../web3/web3.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { ConfigModule, registerAs } from '@nestjs/config';
import {
  MOCK_REPUTATION_ORACLE_WEBHOOK_URL,
  MOCK_S3_ACCESS_KEY,
  MOCK_S3_BUCKET,
  MOCK_S3_ENDPOINT,
  MOCK_S3_PORT,
  MOCK_S3_SECRET_KEY,
  MOCK_S3_USE_SSL,
  MOCK_SIGNATURE,
} from '../../../test/constants';
import { StorageService } from '../storage/storage.service';
import { verifySignature } from '../../common/utils/signature';
import { EventType } from '../../common/enums/webhook';

jest.mock('../../common/utils/signature');

describe('JobController', () => {
  let jobController: JobController;
  let jobService: JobService;

  const chainId = 1;
  const escrowAddress = '0x1234567890123456789012345678901234567890';
  const workerAddress = '0x1234567890123456789012345678901234567891';

  const reputationOracleURL = 'https://example.com/reputationoracle';
  const configServiceMock = {
    get: jest.fn().mockReturnValue(reputationOracleURL),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forFeature(
          registerAs('s3', () => ({
            accessKey: MOCK_S3_ACCESS_KEY,
            secretKey: MOCK_S3_SECRET_KEY,
            endPoint: MOCK_S3_ENDPOINT,
            port: MOCK_S3_PORT,
            useSSL: MOCK_S3_USE_SSL,
            bucket: MOCK_S3_BUCKET,
          })),
        ),
        ConfigModule.forFeature(
          registerAs('server', () => ({
            reputationOracleWebhookUrl: MOCK_REPUTATION_ORACLE_WEBHOOK_URL,
          })),
        ),
      ],
      controllers: [JobController],
      providers: [
        JobService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue({
              address: '0x1234567890123456789012345678901234567892',
              getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
            }),
          },
        },
        StorageService,
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
      const expectedDetails: JobDetailsDto = {
        escrowAddress,
        chainId,
        manifest: {
          requesterTitle: 'Example Title',
          requesterDescription: 'Example Description',
          submissionsRequired: 5,
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
      const expectedJobs: any[] = [
        '0x1234567890123456789012345678901234567891',
        '0x1234567890123456789012345678901234567892',
      ];

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
      const solution = 'job-solution';
      const solveJobDto: SolveJobDto = {
        chainId,
        escrowAddress,
        workerAddress,
        solution,
      };

      jest.spyOn(jobService, 'solveJob').mockResolvedValue();

      await jobController.solveJob(solveJobDto);

      expect(jobService.solveJob).toHaveBeenCalledWith(
        solveJobDto.chainId,
        solveJobDto.escrowAddress,
        solveJobDto.workerAddress,
        solveJobDto.solution,
      );
    });
  });

  describe('invalidJobSolution-solution', () => {
    it('should mark a job solution as invalid', async () => {
      const solveJobDto: WebhookDto = {
        chainId,
        escrowAddress,
        eventType: EventType.SUBMISSION_REJECTED,
        eventData: [{ assigneeId: workerAddress }],
      };

      jest.spyOn(jobService, 'processInvalidJobSolution').mockResolvedValue();

      (verifySignature as jest.Mock).mockReturnValue(true);

      await jobController.invalidJobSolution(MOCK_SIGNATURE, solveJobDto);

      expect(jobService.processInvalidJobSolution).toHaveBeenCalledWith(
        solveJobDto,
      );
    });
  });
});
