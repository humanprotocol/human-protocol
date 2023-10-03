import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { JobService } from './job.service';
import { Web3Service } from '../web3/web3.service';
import { ErrorJob } from '../../common/constants/errors';
import {
  ChainId,
  EscrowClient,
  EscrowStatus,
  StorageClient,
} from '@human-protocol/sdk';
import { JobRequestType } from '../../common/enums/job';
import {
  MOCK_ADDRESS,
  MOCK_FILE_URL,
  MOCK_REPUTATION_ORACLE_WEBHOOK_URL,
  MOCK_REQUESTER_DESCRIPTION,
  MOCK_REQUESTER_TITLE,
  MOCK_S3_ACCESS_KEY,
  MOCK_S3_BUCKET,
  MOCK_S3_ENDPOINT,
  MOCK_S3_PORT,
  MOCK_S3_SECRET_KEY,
  MOCK_S3_USE_SSL,
} from '../../../test/constants';
import { ConfigModule, registerAs } from '@nestjs/config';
import { IManifest, ISolution } from '../../common/interfaces/job';

jest.mock('minio', () => {
  class Client {
    putObject = jest.fn();
    bucketExists = jest.fn().mockResolvedValue(true);
    constructor() {
      (this as any).protocol = 'http:';
      (this as any).host = MOCK_S3_ENDPOINT;
      (this as any).port = MOCK_S3_PORT;
    }
  }

  return { Client };
});

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowClient: {
    build: jest.fn().mockImplementation(() => ({
      createAndSetupEscrow: jest.fn().mockResolvedValue(MOCK_ADDRESS),
    })),
  },
  StorageClient: jest.fn().mockImplementation(() => ({
    downloadFileFromUrl: jest.fn().mockResolvedValue({
      submissionsRequired: 3,
      requestType: JobRequestType.FORTUNE,
    }),
  })),
}));

describe('JobService', () => {
  let jobService: JobService;

  const signerMock = {
    address: MOCK_ADDRESS,
    getAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  beforeEach(async () => {
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
      providers: [
        JobService,
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
          },
        },
        { provide: HttpService, useValue: createMock<HttpService>() },
      ],
    }).compile();

    jobService = moduleRef.get<JobService>(JobService);
  });

  describe('processJobSolution', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should throw bad request exception when recording oracle address does not match', async () => {
      const escrowClient = {
        getRecordingOracleAddress: jest
          .fn()
          .mockResolvedValue('0x0000000000000000000000000000000000000001'),
      };
      (EscrowClient.build as jest.Mock).mockResolvedValue(escrowClient);

      const jobSolution = {
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        exchangeAddress: MOCK_ADDRESS,
        workerAddress: MOCK_ADDRESS,
        solutionUrl: MOCK_FILE_URL,
      };

      await expect(
        jobService.processJobSolution(jobSolution),
      ).rejects.toThrowError(ErrorJob.AddressMismatches);
    });

    it('should throw bad request exception when escrow status is not pending', async () => {
      const escrowClient = {
        getRecordingOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Complete),
      };
      (EscrowClient.build as jest.Mock).mockResolvedValue(escrowClient);

      const jobSolution = {
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        exchangeAddress: MOCK_ADDRESS,
        workerAddress: MOCK_ADDRESS,
        solutionUrl: MOCK_FILE_URL,
      };

      await expect(
        jobService.processJobSolution(jobSolution),
      ).rejects.toThrowError(ErrorJob.InvalidStatus);
    });

    it('should throw bad request exception when manifest is invalid', async () => {
      const invalidManifest = {
        requestType: JobRequestType.FORTUNE,
      };

      const escrowClient = {
        getRecordingOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Pending),
        getManifestUrl: jest
          .fn()
          .mockResolvedValue('http://example.com/manifest'),
      };
      (EscrowClient.build as jest.Mock).mockResolvedValue(escrowClient);
      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValue(invalidManifest);

      const jobSolution = {
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        exchangeAddress: MOCK_ADDRESS,
        workerAddress: MOCK_ADDRESS,
        solutionUrl: MOCK_FILE_URL,
      };

      await expect(
        jobService.processJobSolution(jobSolution),
      ).rejects.toThrowError(ErrorJob.InvalidManifest);
    });

    it('should throw bad request exception when manifest contains an invalid job type', async () => {
      const invalidManifest = {
        submissionsRequired: 1,
        requestType: 'InvalidType',
      };

      const escrowClient = {
        getRecordingOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Pending),
        getManifestUrl: jest
          .fn()
          .mockResolvedValue('http://example.com/manifest'),
      };
      (EscrowClient.build as jest.Mock).mockResolvedValue(escrowClient);
      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValue(invalidManifest);

      const jobSolution = {
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        exchangeAddress: MOCK_ADDRESS,
        workerAddress: MOCK_ADDRESS,
        solutionUrl: MOCK_FILE_URL,
      };

      await expect(
        jobService.processJobSolution(jobSolution),
      ).rejects.toThrowError(ErrorJob.InvalidJobType);
    });

    it('should throw bad request exception when all solutions have already been sent', async () => {
      const manifest: IManifest = {
        submissionsRequired: 2,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount: '10',
        requestType: JobRequestType.FORTUNE,
      };

      const escrowClient = {
        getRecordingOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Pending),
        getManifestUrl: jest
          .fn()
          .mockResolvedValue('http://example.com/manifest'),
        getIntermediateResultsUrl: jest
          .fn()
          .mockResolvedValue('http://example.com/results'),
      };
      (EscrowClient.build as jest.Mock).mockResolvedValue(escrowClient);

      const existingJobSolutions: ISolution[] = [
        {
          exchangeAddress: MOCK_ADDRESS,
          workerAddress: MOCK_ADDRESS,
          solution: 'Solution 1',
        },
        {
          exchangeAddress: MOCK_ADDRESS,
          workerAddress: MOCK_ADDRESS,
          solution: 'Solution 2',
        },
      ];

      const newJobSolutions: ISolution[] = [
        {
          exchangeAddress: MOCK_ADDRESS,
          workerAddress: MOCK_ADDRESS,
          solution: 'Solution 3',
        },
      ];

      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockReturnValueOnce(manifest)
        .mockReturnValueOnce(existingJobSolutions)
        .mockReturnValue(newJobSolutions);

      jobService.sendWebhook = jest.fn().mockRejectedValue(new Error());

      const newSolution = {
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        exchangeAddress: MOCK_ADDRESS,
        workerAddress: MOCK_ADDRESS,
        solutionUrl: MOCK_FILE_URL,
      };

      await expect(
        jobService.processJobSolution(newSolution),
      ).rejects.toThrowError(ErrorJob.AllSolutionsHaveAlreadyBeenSent);
    });

    it('should throw bad request exception when webhook was not sent', async () => {
      const manifest: IManifest = {
        submissionsRequired: 2,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount: '10',
        requestType: JobRequestType.FORTUNE,
      };

      const escrowClient = {
        getRecordingOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Pending),
        getManifestUrl: jest
          .fn()
          .mockResolvedValue('http://example.com/manifest'),
        getIntermediateResultsUrl: jest
          .fn()
          .mockResolvedValue('http://example.com/results'),
      };
      (EscrowClient.build as jest.Mock).mockResolvedValue(escrowClient);

      const existingJobSolutions: ISolution[] = [
        {
          exchangeAddress: MOCK_ADDRESS,
          workerAddress: MOCK_ADDRESS,
          solution: 'Solution 1',
        },
      ];
      const newJobSolutions: ISolution[] = [
        {
          exchangeAddress: MOCK_ADDRESS,
          workerAddress: MOCK_ADDRESS,
          solution: 'Solution 2',
        },
      ];

      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockReturnValueOnce(manifest)
        .mockReturnValueOnce(existingJobSolutions)
        .mockReturnValue(newJobSolutions);

      jest
        .spyOn(jobService, 'sendWebhook')
        .mockRejectedValue(new Error(ErrorJob.WebhookWasNotSent));

      const newSolution = {
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        exchangeAddress: MOCK_ADDRESS,
        workerAddress: MOCK_ADDRESS,
        solutionUrl: MOCK_FILE_URL,
      };

      await expect(
        jobService.processJobSolution(newSolution),
      ).rejects.toThrowError(ErrorJob.WebhookWasNotSent);
    });

    it('should call send webhook method when solution is recorded', async () => {
      const escrowClient = {
        getRecordingOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Pending),
        getManifestUrl: jest
          .fn()
          .mockResolvedValue('http://example.com/manifest'),
        getIntermediateResultsUrl: jest.fn().mockResolvedValue(''),
        storeResults: jest.fn().mockResolvedValue(true),
      };
      (EscrowClient.build as jest.Mock).mockResolvedValue(escrowClient);

      jobService.sendWebhook = jest.fn().mockResolvedValue(true);

      const manifest: IManifest = {
        submissionsRequired: 3,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount: '10',
        requestType: JobRequestType.FORTUNE,
      };

      const existingJobSolutions: ISolution[] = [
        {
          exchangeAddress: MOCK_ADDRESS,
          workerAddress: MOCK_ADDRESS,
          solution: 'Solution 1',
        },
      ];

      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockReturnValueOnce(manifest)
        .mockReturnValue(existingJobSolutions);

      const jobSolution = {
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        exchangeAddress: MOCK_ADDRESS,
        workerAddress: MOCK_ADDRESS,
        solutionUrl: MOCK_FILE_URL,
      };

      const result = await jobService.processJobSolution(jobSolution);
      expect(result).toEqual('Solution are recorded.');
    });
  });
});
