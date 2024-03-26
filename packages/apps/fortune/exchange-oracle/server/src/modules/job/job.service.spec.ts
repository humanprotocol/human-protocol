import { createMock } from '@golevelup/ts-jest';
import {
  Encryption,
  EscrowClient,
  OperatorUtils,
  StorageClient,
} from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { ConfigModule, ConfigService, registerAs } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import {
  MOCK_MANIFEST_URL,
  MOCK_PRIVATE_KEY,
  MOCK_S3_ACCESS_KEY,
  MOCK_S3_BUCKET,
  MOCK_S3_ENDPOINT,
  MOCK_S3_PORT,
  MOCK_S3_SECRET_KEY,
  MOCK_S3_USE_SSL,
} from '../../../test/constants';
import {
  AssignmentStatus,
  JobFieldName,
  JobStatus,
  JobType,
} from '../../common/enums/job';
import { EventType, WebhookStatus } from '../../common/enums/webhook';
import { AssignmentEntity } from '../assignment/assignment.entity';
import { AssignmentRepository } from '../assignment/assignment.repository';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import { WebhookDto } from '../webhook/webhook.dto';
import { WebhookRepository } from '../webhook/webhook.repository';
import { ManifestDto } from './job.dto';
import { JobEntity } from './job.entity';
import { JobRepository } from './job.repository';
import { JobService } from './job.service';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowClient: {
    build: jest.fn(),
  },
  OperatorUtils: {
    getLeader: jest.fn(),
  },
  StorageClient: {
    downloadFileFromUrl: jest.fn(),
  },
  Encryption: {
    build: jest.fn(),
  },
}));
jest.mock('minio', () => {
  class Client {
    putObject = jest.fn();
    bucketExists = jest.fn().mockResolvedValue(true);
    constructor() {
      (this as any).protocol = 'http:';
      (this as any).host = 'localhost';
      (this as any).port = 9000;
    }
  }

  return { Client };
});

describe('JobService', () => {
  let jobService: JobService;
  let web3Service: Web3Service;
  let storageService: StorageService;
  let jobRepository: JobRepository;
  let assignmentRepository: AssignmentRepository;
  let webhookRepository: WebhookRepository;

  const chainId = 1;
  const escrowAddress = '0x1234567890123456789012345678901234567890';
  const workerAddress = '0x1234567890123456789012345678901234567891';
  const reputationNetwork = '0x1234567890123456789012345678901234567892';

  const signerMock = {
    address: '0x1234567890123456789012345678901234567892',
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  const configServiceMock: Partial<ConfigService> = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'WEB3_PRIVATE_KEY':
          return MOCK_PRIVATE_KEY;
      }
    }),
  };

  const httpServicePostMock = jest
    .fn()
    .mockReturnValue(of({ status: 200, data: {} }));

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
      ],
      providers: [
        JobService,
        StorageService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
          },
        },
        { provide: JobRepository, useValue: createMock<JobRepository>() },
        {
          provide: AssignmentRepository,
          useValue: createMock<AssignmentRepository>(),
        },
        {
          provide: WebhookRepository,
          useValue: createMock<WebhookRepository>(),
        },
        {
          provide: HttpService,
          useValue: {
            post: httpServicePostMock,
            axiosRef: {
              get: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    jobService = moduleRef.get<JobService>(JobService);
    web3Service = moduleRef.get<Web3Service>(Web3Service);
    storageService = moduleRef.get<StorageService>(StorageService);
    jobRepository = moduleRef.get<JobRepository>(JobRepository);
    assignmentRepository =
      moduleRef.get<AssignmentRepository>(AssignmentRepository);
    webhookRepository = moduleRef.get<WebhookRepository>(WebhookRepository);
  });

  describe('createJob', () => {
    beforeAll(async () => {
      jest.spyOn(jobRepository, 'createUnique');
      (EscrowClient.build as any).mockImplementation(() => ({
        getReputationOracleAddress: jest
          .fn()
          .mockResolvedValue(reputationNetwork),
      }));
    });
    const webhook: WebhookDto = {
      chainId,
      escrowAddress,
      eventType: EventType.ESCROW_CREATED,
    };

    it('should create a new job in the database', async () => {
      jest
        .spyOn(jobRepository, 'findOneByChainIdAndEscrowAddress')
        .mockResolvedValue(null);
      const result = await jobService.createJob(webhook);

      expect(result).toEqual(undefined);
      expect(jobRepository.createUnique).toHaveBeenCalledWith({
        chainId: chainId,
        escrowAddress: escrowAddress,
        reputationNetwork: reputationNetwork,
        status: JobStatus.ACTIVE,
      });
    });

    it('should fail if job already exists', async () => {
      jest
        .spyOn(jobRepository, 'findOneByChainIdAndEscrowAddress')
        .mockResolvedValue({
          chainId: chainId,
          escrowAddress: escrowAddress,
          status: JobStatus.ACTIVE,
        } as JobEntity);

      await expect(jobService.createJob(webhook)).rejects.toThrow(
        'Job already exists',
      );
    });
  });

  describe('getJobList', () => {
    const jobs = [
      {
        jobId: 1,
        chainId: 1,
        escrowAddress,
        status: JobStatus.ACTIVE,
        createdAt: new Date(),
      },
    ];

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return an array of jobs calling the manifest', async () => {
      const manifest: ManifestDto = {
        requesterTitle: 'Example Title',
        requesterDescription: 'Example Description',
        submissionsRequired: 5,
        fundAmount: 100,
      };

      jest.spyOn(jobService, 'getManifest').mockResolvedValue(manifest);
      jest
        .spyOn(jobRepository, 'fetchFiltered')
        .mockResolvedValueOnce({ entities: jobs as any, itemCount: 1 });

      const result = await jobService.getJobList(
        {
          chainId,
          jobType: JobType.FORTUNE,
          fields: [JobFieldName.JobDescription],
          escrowAddress,
          status: JobStatus.ACTIVE,
          page: 0,
          pageSize: 10,
          skip: 0,
        },
        workerAddress,
      );

      expect(result.totalResults).toEqual(1);
      expect(result.results[0]).toEqual({
        chainId: 1,
        jobDescription: 'Example Description',
        escrowAddress: escrowAddress,
        jobType: JobType.FORTUNE,
        status: JobStatus.ACTIVE,
      });
      expect(jobService.getManifest).toHaveBeenCalledWith(
        chainId,
        escrowAddress,
      );
    });

    it('should return an array of jobs without calling the manifest', async () => {
      jest.spyOn(jobService, 'getManifest');
      jest
        .spyOn(jobRepository, 'fetchFiltered')
        .mockResolvedValueOnce({ entities: jobs as any, itemCount: 1 });

      const result = await jobService.getJobList(
        {
          chainId,
          jobType: JobType.FORTUNE,
          fields: [JobFieldName.CreatedAt],
          escrowAddress,
          status: JobStatus.ACTIVE,
          page: 0,
          pageSize: 10,
          skip: 0,
        },
        workerAddress,
      );

      expect(result.totalResults).toEqual(1);
      expect(result.results[0]).toEqual({
        chainId: 1,
        createdAt: expect.any(String),
        escrowAddress: escrowAddress,
        jobType: JobType.FORTUNE,
        status: JobStatus.ACTIVE,
      });
      expect(jobService.getManifest).not.toHaveBeenCalled();
    });
  });

  describe('solveJob', () => {
    const assignment = {
      jobId: 1,
      workerAddress: workerAddress,
      status: AssignmentStatus.ACTIVE,
    };

    beforeAll(async () => {
      (EscrowClient.build as any).mockImplementation(() => ({
        getManifestUrl: jest.fn().mockResolvedValue(MOCK_MANIFEST_URL),
        getJobLauncherAddress: jest
          .fn()
          .mockResolvedValue('0x1234567890123456789012345678901234567893'),
        getRecordingOracleAddress: jest
          .fn()
          .mockResolvedValue('0x1234567890123456789012345678901234567893'),
      }));
    });

    it('should solve a job', async () => {
      const manifest: ManifestDto = {
        requesterTitle: 'Example Title',
        requesterDescription: 'Example Description',
        submissionsRequired: 5,
        fundAmount: 100,
      };

      jest
        .spyOn(assignmentRepository, 'findOneByEscrowAndWorker')
        .mockResolvedValue(assignment as AssignmentEntity);

      storageService.downloadJobSolutions = jest.fn().mockResolvedValueOnce([]);

      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValueOnce(manifest);

      const solutionsUrl =
        'http://localhost:9000/solution/0x1234567890123456789012345678901234567890-1.json';

      const recordingOracleURLMock = 'https://example.com/recordingoracle';

      OperatorUtils.getLeader = jest.fn().mockResolvedValue({
        webhookUrl: recordingOracleURLMock,
      });
      storageService.uploadJobSolutions = jest
        .fn()
        .mockResolvedValue(solutionsUrl);

      await jobService.solveJob(
        chainId,
        escrowAddress,
        workerAddress,
        'solution',
      );
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
      expect(webhookRepository.createUnique).toHaveBeenCalledWith({
        escrowAddress,
        chainId,
        eventType: EventType.SUBMISSION_IN_REVIEW,
        retriesCount: 0,
        status: WebhookStatus.PENDING,
        waitUntil: expect.any(Date),
      });
      expect(assignment.status).toBe(AssignmentStatus.VALIDATION);
    });

    it('should fail if user is not assigned to the job', async () => {
      jest
        .spyOn(assignmentRepository, 'findOneByEscrowAndWorker')
        .mockResolvedValue(null);
      await expect(
        jobService.solveJob(chainId, escrowAddress, workerAddress, 'solution'),
      ).rejects.toThrow('User is not assigned to the job');
    });

    it('should fail if job has already been completed', async () => {
      const manifest: ManifestDto = {
        requesterTitle: 'Example Title',
        requesterDescription: 'Example Description',
        submissionsRequired: 1,
        fundAmount: 100,
      };

      jest
        .spyOn(assignmentRepository, 'findOneByEscrowAndWorker')
        .mockResolvedValue(assignment as AssignmentEntity);

      storageService.downloadJobSolutions = jest.fn().mockResolvedValueOnce([
        {
          exchangeAddress: '0x1234567890123456789012345678901234567892',
          workerAddress: '0x1234567890123456789012345678901234567892',
          solution: 'test',
        },
      ]);

      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValueOnce(manifest);

      (Encryption.build as any).mockImplementation(() => ({
        decrypt: jest.fn().mockResolvedValue(JSON.stringify(manifest)),
      }));

      const recordingOracleURLMock = 'https://example.com/recordingoracle';

      OperatorUtils.getLeader = jest.fn().mockResolvedValue({
        webhookUrl: recordingOracleURLMock,
      });

      await expect(
        jobService.solveJob(chainId, escrowAddress, workerAddress, 'solution'),
      ).rejects.toThrow('This job has already been completed');
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
    });

    it('should fail if the escrow address is invalid', async () => {
      const escrowAddress = 'invalid_address';
      const solution = 'job-solution';

      await expect(
        jobService.solveJob(chainId, escrowAddress, workerAddress, solution),
      ).rejects.toThrow('Invalid address');
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
    });

    it('should fail if user has already submitted a solution', async () => {
      const solution = 'job-solution';

      jest
        .spyOn(assignmentRepository, 'findOneByEscrowAndWorker')
        .mockResolvedValue(assignment as AssignmentEntity);

      (EscrowClient.build as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest
          .fn()
          .mockResolvedValue('0x1234567890123456789012345678901234567893'),
      }));
      OperatorUtils.getLeader = jest.fn().mockResolvedValue({
        webhookUrl: 'https://example.com/recordingoracle',
      });

      storageService.downloadJobSolutions = jest.fn().mockResolvedValue([
        {
          exchangeAddress: '0x1234567890123456789012345678901234567892',
          workerAddress: '0x1234567890123456789012345678901234567891',
          solution: 'test',
        },
      ]);

      await expect(
        jobService.solveJob(chainId, escrowAddress, workerAddress, solution),
      ).rejects.toThrow('User has already submitted a solution');
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
    });
  });

  describe('processInvalidJob', () => {
    it('should mark a job solution as invalid', async () => {
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const solution = 'test';

      const jobSolution = {
        workerAddress,
        solution,
      };
      const existingJobSolutions = [jobSolution];
      storageService.downloadJobSolutions = jest
        .fn()
        .mockResolvedValue(existingJobSolutions);
      storageService.uploadJobSolutions = jest.fn();

      await jobService.processInvalidJobSolution({
        chainId,
        escrowAddress,
        eventType: EventType.SUBMISSION_REJECTED,
        eventData: { assignments: [{ assigneeId: workerAddress }] },
      });

      expect(storageService.uploadJobSolutions).toHaveBeenCalledWith(
        escrowAddress,
        chainId,
        [
          {
            workerAddress,
            solution,
            error: true,
          },
        ],
      );
    });

    it('should throw an error if solution was not previously in S3', async () => {
      const exchangeAddress = '0x1234567890123456789012345678901234567892';
      const workerAddress = '0x1234567890123456789012345678901234567891';

      const existingJobSolutions = [
        {
          exchangeAddress,
          workerAddress: '0x1234567890123456789012345678901234567892',
          solution: 'test',
        },
      ];
      storageService.downloadJobSolutions = jest
        .fn()
        .mockResolvedValue(existingJobSolutions);

      await expect(
        jobService.processInvalidJobSolution({
          chainId,
          escrowAddress,
          eventType: EventType.SUBMISSION_REJECTED,
          eventData: { assignments: [{ assigneeId: workerAddress }] },
        }),
      ).rejects.toThrow(`Solution not found in Escrow: ${escrowAddress}`);
    });
  });
});
