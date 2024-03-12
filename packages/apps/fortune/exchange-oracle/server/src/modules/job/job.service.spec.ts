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
  OperatorUtils,
  Encryption,
  EncryptionUtils,
} from '@human-protocol/sdk';
import {
  JOB_LAUNCHER_WEBHOOK_URL,
  MOCK_MANIFEST_URL,
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
  let httpService: HttpService;
  let storageService: StorageService;

  const chainId = 1;
  const escrowAddress = '0x1234567890123456789012345678901234567890';
  const workerAddress = '0x1234567890123456789012345678901234567891';

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
    beforeAll(async () => {
      (EscrowClient.build as any).mockImplementation(() => ({
        getManifestUrl: jest.fn().mockResolvedValue(MOCK_MANIFEST_URL),
        getJobLauncherAddress: jest
          .fn()
          .mockResolvedValue('0x1234567890123456789012345678901234567893'),
      }));
    });

    it('should return job details encrypted', async () => {
      const manifest: ManifestDto = {
        requesterTitle: 'Example Title',
        requesterDescription: 'Example Description',
        submissionsRequired: 5,
        fundAmount: 100,
      };

      EncryptionUtils.isEncrypted = jest.fn().mockReturnValue(true);
      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValueOnce('encrypted string');

      storageService.downloadJobSolutions = jest.fn().mockResolvedValue([]);

      (Encryption.build as any).mockImplementation(() => ({
        decrypt: jest.fn().mockResolvedValue(JSON.stringify(manifest)),
      }));

      const result = await jobService.getDetails(chainId, escrowAddress);

      expect(result).toEqual({
        escrowAddress,
        chainId,
        manifest,
      });
    });

    it('should return job details not encrypted', async () => {
      const manifest: ManifestDto = {
        requesterTitle: 'Example Title',
        requesterDescription: 'Example Description',
        submissionsRequired: 5,
        fundAmount: 100,
      };

      EncryptionUtils.isEncrypted = jest.fn().mockReturnValue(false);
      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValueOnce(JSON.stringify(manifest));

      storageService.downloadJobSolutions = jest.fn().mockResolvedValue([]);

      const result = await jobService.getDetails(chainId, escrowAddress);

      expect(result).toEqual({
        escrowAddress,
        chainId,
        manifest,
      });
    });

    it('should call job launcher webhook if manifest is empty', async () => {
      StorageClient.downloadFileFromUrl = jest.fn().mockResolvedValueOnce(null);

      OperatorUtils.getLeader = jest.fn().mockResolvedValue({
        webhookUrl: JOB_LAUNCHER_WEBHOOK_URL,
      });

      (Encryption.build as any).mockImplementation(() => ({
        decrypt: jest.fn().mockResolvedValue(null),
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
        event_data: { assignments: [{ reason: 'Unable to get manifest' }] },
      };
      expect(httpServicePostMock).toHaveBeenCalledWith(
        JOB_LAUNCHER_WEBHOOK_URL + ESCROW_FAILED_ENDPOINT,
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

    it('should fail if job has already been completed', async () => {
      const manifest: ManifestDto = {
        requesterTitle: 'Example Title',
        requesterDescription: 'Example Description',
        submissionsRequired: 1,
        fundAmount: 100,
      };

      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValueOnce(manifest);

      storageService.downloadJobSolutions = jest.fn().mockResolvedValueOnce([
        {
          exchangeAddress: '0x1234567890123456789012345678901234567892',
          workerAddress: '0x1234567890123456789012345678901234567892',
          solution: 'test',
        },
      ]);

      (Encryption.build as any).mockImplementation(() => ({
        decrypt: jest.fn().mockResolvedValue(JSON.stringify(manifest)),
      }));

      await expect(
        jobService.getDetails(chainId, escrowAddress),
      ).rejects.toThrow('This job has already been completed');
    });

    it('should fail if encrypted manifest is invalid', async () => {
      const manifest = JSON.stringify({
        requesterTitle: 'Example Title',
        requesterDescription: 'Example Description',
        submissionsRequired: 5,
        fundAmount: 100,
      });

      EncryptionUtils.isEncrypted = jest.fn().mockReturnValue(true);
      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValueOnce(manifest)
        .mockResolvedValueOnce([]);

      (Encryption.build as any).mockImplementation(() => ({
        decrypt: jest.fn().mockRejectedValue(new Error('Invalid manifest')),
      }));

      await expect(
        jobService.getDetails(chainId, escrowAddress),
      ).rejects.toThrow('Unable to decrypt manifest');
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
      const expectedBody = {
        escrow_address: escrowAddress,
        chain_id: chainId,
        solutions_url: solutionsUrl,
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

    it('should fail if recording oracle url is empty', async () => {
      const manifest: ManifestDto = {
        requesterTitle: 'Example Title',
        requesterDescription: 'Example Description',
        submissionsRequired: 5,
        fundAmount: 100,
      };

      storageService.downloadJobSolutions = jest.fn().mockResolvedValueOnce([]);

      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValueOnce(manifest);

      const solutionsUrl =
        'http://localhost:9000/solution/0x1234567890123456789012345678901234567890-1.json';

      storageService.uploadJobSolutions = jest
        .fn()
        .mockResolvedValue(solutionsUrl);

      const solution = 'job-solution';

      OperatorUtils.getLeader = jest.fn().mockResolvedValue({
        webhookUrl: '',
      });

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
