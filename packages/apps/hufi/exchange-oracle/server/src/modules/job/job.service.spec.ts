import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import { Web3Service } from '../web3/web3.service';
import { JobService } from './job.service';
import {
  EscrowClient,
  StorageClient,
  EscrowUtils,
  StakingClient,
} from '@human-protocol/sdk';
import {
  MOCK_PRIVATE_KEY,
  MOCK_S3_ACCESS_KEY,
  MOCK_S3_BUCKET,
  MOCK_S3_ENDPOINT,
  MOCK_S3_PORT,
  MOCK_S3_SECRET_KEY,
  MOCK_S3_USE_SSL,
} from '../../../test/constants';
import { EventType } from '../../common/enums/webhook';
import {
  ESCROW_FAILED_ENDPOINT,
  HEADER_SIGNATURE_KEY,
} from '../../common/constant';
import { signMessage } from '../../common/utils/signature';
import { ConfigModule, registerAs } from '@nestjs/config';
import { StorageService } from '../storage/storage.service';
import { ManifestDto } from './job.dto';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowClient: {
    build: jest.fn(),
  },
  StakingClient: {
    build: jest.fn(),
  },
  StorageClient: {
    downloadFileFromUrl: jest.fn(),
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
  let httpService: HttpService;
  let storageService: StorageService;

  const chainId = 1;
  const escrowAddress = '0x1234567890123456789012345678901234567890';
  const workerAddress = '0x1234567890123456789012345678901234567891';

  const signerMock = {
    address: '0x1234567890123456789012345678901234567892',
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  const reputationOracleURL = 'https://example.com/reputationoracle';
  const configServiceMock: Partial<ConfigService> = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'REPUTATION_ORACLE_URL':
          return reputationOracleURL;
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
    httpService = moduleRef.get<HttpService>(HttpService);
    storageService = moduleRef.get<StorageService>(StorageService);
  });

  describe('getDetails', () => {
    it('should return job details', async () => {
      const manifest: ManifestDto = {
        requesterTitle: 'Example Title',
        requesterDescription: 'Example Description',
        submissionsRequired: 5,
        fundAmount: 100,
      };

      httpService.axiosRef.get = jest.fn().mockResolvedValue({
        status: 200,
        data: manifest,
      });

      StorageClient.downloadFileFromUrl = jest.fn().mockResolvedValue([]);

      const result = await jobService.getDetails(chainId, escrowAddress);

      expect(result).toEqual({
        escrowAddress,
        chainId,
        manifest,
      });
    });

    it('should call job launcher webhook if manifest is empty', async () => {
      const jobLauncherWebhookUrl = 'https://example.com/reputationoracle';
      (EscrowClient.build as any).mockImplementation(() => ({
        getJobLauncherAddress: jest
          .fn()
          .mockResolvedValue('0x1234567890123456789012345678901234567893'),
      }));
      (StakingClient.build as any).mockImplementation(() => ({
        getLeader: jest.fn().mockResolvedValue({
          webhookUrl: jobLauncherWebhookUrl,
        }),
      }));

      httpService.axiosRef.get = jest.fn().mockResolvedValue({
        status: 200,
        data: null,
      });
      await expect(
        jobService.getDetails(chainId, escrowAddress),
      ).rejects.toThrow('Unable to get manifest');

      const expectedBody = {
        escrow_address: escrowAddress,
        chain_id: chainId,
        event_type: EventType.TASK_CREATION_FAILED,
        reason: 'Unable to get manifest',
      };
      expect(httpServicePostMock).toHaveBeenCalledWith(
        jobLauncherWebhookUrl + ESCROW_FAILED_ENDPOINT,
        expectedBody,
        {
          headers: {
            [HEADER_SIGNATURE_KEY]: await signMessage(
              expectedBody,
              MOCK_PRIVATE_KEY,
            ),
          },
        },
      );
    });

    it('should fail if reputation oracle url is empty', async () => {
      (configServiceMock as any).get.mockImplementationOnce((key: string) => {
        if (key === 'REPUTATION_ORACLE_URL') {
          return '';
        }
      });

      await expect(
        jobService.getDetails(chainId, escrowAddress),
      ).rejects.toThrow('Unable to get Reputation Oracle URL');
    });

    it('should fail if job has already been completed', async () => {
      const manifest: ManifestDto = {
        requesterTitle: 'Example Title',
        requesterDescription: 'Example Description',
        submissionsRequired: 1,
        fundAmount: 100,
      };

      httpService.axiosRef.get = jest.fn().mockResolvedValue({
        status: 200,
        data: manifest,
      });

      StorageClient.downloadFileFromUrl = jest.fn().mockResolvedValue([
        {
          exchangeAddress: '0x1234567890123456789012345678901234567892',
          workerAddress: '0x1234567890123456789012345678901234567892',
          solution: 'test',
        },
      ]);

      await expect(
        jobService.getDetails(chainId, escrowAddress),
      ).rejects.toThrow('This job has already been completed');
    });
  });

  describe('getPendingJobs', () => {
    it('should return an array of pending jobs', async () => {
      EscrowUtils.getEscrows = jest
        .fn()
        .mockReturnValue([
          { address: '0x1234567890123456789012345678901234567893' },
          { address: '0x1234567890123456789012345678901234567894' },
        ]);

      const result = await jobService.getPendingJobs(chainId, workerAddress);

      expect(result).toEqual([
        '0x1234567890123456789012345678901234567893',
        '0x1234567890123456789012345678901234567894',
      ]);
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
    });

    it('should return an array of pending jobs removing jobs already submitted by worker', async () => {
      EscrowUtils.getEscrows = jest
        .fn()
        .mockReturnValue([
          { address: '0x1234567890123456789012345678901234567893' },
          { address: '0x1234567890123456789012345678901234567894' },
        ]);

      jobService['storage']['0x1234567890123456789012345678901234567893'] = [
        workerAddress,
      ];

      const result = await jobService.getPendingJobs(chainId, workerAddress);

      expect(result).toEqual(['0x1234567890123456789012345678901234567894']);
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
    });

    it('should return an empty array if there are no pending jobs', async () => {
      EscrowUtils.getEscrows = jest.fn().mockReturnValue([]);

      const result = await jobService.getPendingJobs(chainId, workerAddress);

      expect(result).toEqual([]);
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
    });
  });

  describe('solveJob', () => {
    it('should solve a job', async () => {
      const manifest: ManifestDto = {
        requesterTitle: 'Example Title',
        requesterDescription: 'Example Description',
        submissionsRequired: 5,
        fundAmount: 100,
      };

      httpService.axiosRef.get = jest.fn().mockResolvedValue({
        status: 200,
        data: manifest,
      });
      const solutionsUrl =
        'http://localhost:9000/solution/0x1234567890123456789012345678901234567890-1.json';

      const recordingOracleURLMock = 'https://example.com/recordingoracle';

      (EscrowClient.build as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest
          .fn()
          .mockResolvedValue('0x1234567890123456789012345678901234567893'),
      }));
      (StakingClient.build as any).mockImplementation(() => ({
        getLeader: jest.fn().mockResolvedValue({
          webhookUrl: recordingOracleURLMock,
        }),
      }));

      StorageClient.downloadFileFromUrl = jest.fn().mockResolvedValue([]);

      await jobService.solveJob(
        chainId,
        escrowAddress,
        workerAddress,
        'solution',
      );
      const expectedBody = {
        escrowAddress,
        chainId,
        solutionsUrl,
      };
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
      expect(httpServicePostMock).toHaveBeenCalledWith(
        recordingOracleURLMock,
        expect.objectContaining(expectedBody),
        {
          headers: {
            [HEADER_SIGNATURE_KEY]: await signMessage(
              expectedBody,
              MOCK_PRIVATE_KEY,
            ),
          },
        },
      );
    });

    it('should fail if job has already been completed', async () => {
      const manifest: ManifestDto = {
        requesterTitle: 'Example Title',
        requesterDescription: 'Example Description',
        submissionsRequired: 1,
        fundAmount: 100,
      };

      httpService.axiosRef.get = jest.fn().mockResolvedValue({
        status: 200,
        data: manifest,
      });

      const recordingOracleURLMock = 'https://example.com/recordingoracle';

      (EscrowClient.build as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest
          .fn()
          .mockResolvedValue('0x1234567890123456789012345678901234567893'),
      }));
      (StakingClient.build as any).mockImplementation(() => ({
        getLeader: jest.fn().mockResolvedValue({
          webhookUrl: recordingOracleURLMock,
        }),
      }));

      StorageClient.downloadFileFromUrl = jest.fn().mockResolvedValue([
        {
          exchangeAddress: '0x1234567890123456789012345678901234567892',
          workerAddress: '0x1234567890123456789012345678901234567892',
          solution: 'test',
        },
      ]);

      await expect(
        jobService.solveJob(chainId, escrowAddress, workerAddress, 'solution'),
      ).rejects.toThrow('This job has already been completed');
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
    });

    it('should fail if the escrow address is invalid', async () => {
      const escrowAddress = 'invalid_address';
      const solution = 'job-solution';
      (EscrowClient.build as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest
          .fn()
          .mockRejectedValue(new Error('Invalid address')),
      }));

      await expect(
        jobService.solveJob(chainId, escrowAddress, workerAddress, solution),
      ).rejects.toThrow('Invalid address');
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
    });

    it('should fail if recording oracle url is empty', async () => {
      const solution = 'job-solution';

      (EscrowClient.build as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest
          .fn()
          .mockResolvedValue('0x1234567890123456789012345678901234567893'),
      }));
      (StakingClient.build as any).mockImplementation(() => ({
        getLeader: jest.fn().mockResolvedValue({
          webhookUrl: '',
        }),
      }));

      await expect(
        jobService.solveJob(chainId, escrowAddress, workerAddress, solution),
      ).rejects.toThrow('Unable to get Recording Oracle webhook URL');
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
    });

    it('should fail if user has already submitted a solution', async () => {
      const solution = 'job-solution';

      (EscrowClient.build as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest
          .fn()
          .mockResolvedValue('0x1234567890123456789012345678901234567893'),
      }));
      (StakingClient.build as any).mockImplementation(() => ({
        getLeader: jest.fn().mockResolvedValue({
          webhookUrl: 'https://example.com/recordingoracle',
        }),
      }));

      StorageClient.downloadFileFromUrl = jest.fn().mockResolvedValue([
        {
          exchangeAddress: '0x1234567890123456789012345678901234567892',
          workerAddress: '0x1234567890123456789012345678901234567891',
          solution: 'test',
        },
      ]);

      jobService['storage'][escrowAddress] = [workerAddress];

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
      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValue(existingJobSolutions);
      await jobService.processInvalidJobSolution({
        chainId,
        escrowAddress,
        workerAddress,
      });

      expect(storageService.minioClient.putObject).toHaveBeenCalledWith(
        MOCK_S3_BUCKET,
        `${escrowAddress}-${chainId}.json`,
        JSON.stringify([
          {
            workerAddress,
            solution,
            error: true,
          },
        ]),

        {
          'Content-Type': 'application/json',
        },
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
      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValue(existingJobSolutions);

      await expect(
        jobService.processInvalidJobSolution({
          chainId,
          escrowAddress,
          workerAddress,
        }),
      ).rejects.toThrow(`Solution not found in Escrow: ${escrowAddress}`);
    });
  });
});
