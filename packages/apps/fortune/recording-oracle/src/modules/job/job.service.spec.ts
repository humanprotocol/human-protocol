import { Test } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { JobService } from './job.service';
import { Web3Service } from '../web3/web3.service';
import { ErrorJob } from '../../common/constants/errors';
import {
  ChainId,
  EncryptionUtils,
  EscrowClient,
  EscrowStatus,
  KVStoreClient,
  StorageClient,
} from '@human-protocol/sdk';
import { JobRequestType, SolutionError } from '../../common/enums/job';
import {
  MOCK_ADDRESS,
  MOCK_ENCRYPTION_PASSPHRASE,
  MOCK_ENCRYPTION_PRIVATE_KEY,
  MOCK_EXCHANGE_ORACLE_WEBHOOK_URL,
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
  MOCK_WEB3_PRIVATE_KEY,
} from '../../../test/constants';
import { ConfigModule, registerAs } from '@nestjs/config';
import { IManifest, ISolution } from '../../common/interfaces/job';
import { of } from 'rxjs';
import { StorageService } from '../storage/storage.service';
import { HEADER_SIGNATURE_KEY } from '../../common/constants';
import { signMessage } from '../../common/utils/signature';
import { EventType } from '../../common/enums/webhook';
import { WebhookDto } from '../webhook/webhook.dto';

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
    downloadFileFromUrl: jest.fn().mockResolvedValue(
      JSON.stringify({
        submissionsRequired: 3,
        requestType: JobRequestType.FORTUNE,
      }),
    ),
  })),
  KVStoreClient: {
    build: jest.fn().mockImplementation(() => ({
      get: jest.fn(),
      getPublicKey: jest.fn().mockResolvedValue('publicKey'),
    })),
  },
  EncryptionUtils: {
    encrypt: jest.fn().mockResolvedValue('encrypted'),
  },
}));

describe('JobService', () => {
  let jobService: JobService;

  const signerMock = {
    address: MOCK_ADDRESS,
    getAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  const httpServicePostMock = jest
    .fn()
    .mockReturnValue(of({ status: 200, data: {} }));

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
          registerAs('web3', () => ({
            web3PrivateKey: MOCK_WEB3_PRIVATE_KEY,
          })),
        ),
        ConfigModule.forFeature(
          registerAs('server', () => ({
            encryptionPrivateKey: MOCK_ENCRYPTION_PRIVATE_KEY,
            encryptionPassphrase: MOCK_ENCRYPTION_PASSPHRASE,
          })),
        ),
      ],
      providers: [
        JobService,
        StorageService,
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
  });

  describe('processJobSolution', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should throw bad request exception when recording oracle address does not match', async () => {
      const escrowClient = {
        getRecordingOracleAddress: jest
          .fn()
          .mockResolvedValue('0x0000000000000000000000000000000000000001'),
      };
      (EscrowClient.build as jest.Mock).mockResolvedValue(escrowClient);

      const jobSolution: WebhookDto = {
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        eventType: EventType.SUBMISSION_IN_REVIEW,
        eventData: { solutionsUrl: MOCK_FILE_URL },
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

      const jobSolution: WebhookDto = {
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        eventType: EventType.SUBMISSION_IN_REVIEW,
        eventData: { solutionsUrl: MOCK_FILE_URL },
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
        .mockResolvedValue(JSON.stringify(invalidManifest));

      const jobSolution: WebhookDto = {
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        eventType: EventType.SUBMISSION_IN_REVIEW,
        eventData: { solutionsUrl: MOCK_FILE_URL },
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
        .mockResolvedValue(JSON.stringify(invalidManifest));
      EncryptionUtils.isEncrypted = jest.fn().mockReturnValueOnce(false);

      const jobSolution: WebhookDto = {
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        eventType: EventType.SUBMISSION_IN_REVIEW,
        eventData: { solutionsUrl: MOCK_FILE_URL },
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
          workerAddress: '0x0000000000000000000000000000000000000000',
          solution: 'Solution 1',
        },
        {
          workerAddress: '0x0000000000000000000000000000000000000001',
          solution: 'Solution 2',
        },
      ];

      const exchangeJobSolutions: ISolution[] = [
        {
          workerAddress: '0x0000000000000000000000000000000000000000',
          solution: 'Solution 1',
        },
        {
          workerAddress: '0x0000000000000000000000000000000000000001',
          solution: 'Solution 2',
        },
        {
          workerAddress: '0x0000000000000000000000000000000000000002',
          solution: 'Solution 3',
        },
      ];

      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValueOnce(JSON.stringify(manifest))
        .mockResolvedValueOnce(JSON.stringify(existingJobSolutions))
        .mockResolvedValue(JSON.stringify(exchangeJobSolutions));

      const newSolution: WebhookDto = {
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        eventType: EventType.SUBMISSION_IN_REVIEW,
        eventData: { solutionsUrl: MOCK_FILE_URL },
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
        getReputationOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Pending),
        getManifestUrl: jest
          .fn()
          .mockResolvedValue('http://example.com/manifest'),
        getIntermediateResultsUrl: jest
          .fn()
          .mockResolvedValue('http://example.com/results'),
        storeResults: jest.fn().mockResolvedValue(true),
      };
      (EscrowClient.build as jest.Mock).mockResolvedValue(escrowClient);

      const existingJobSolutions: ISolution[] = [
        {
          workerAddress: MOCK_ADDRESS,
          solution: 'Solution 1',
        },
      ];

      const exchangeJobSolutions: ISolution[] = [
        {
          workerAddress: '0x0000000000000000000000000000000000000000',
          solution: 'Solution 1',
        },
        {
          workerAddress: '0x0000000000000000000000000000000000000001',
          solution: 'Solution 2',
        },
      ];

      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValueOnce(JSON.stringify(manifest))
        .mockResolvedValueOnce(JSON.stringify(existingJobSolutions))
        .mockResolvedValue(JSON.stringify(exchangeJobSolutions));

      httpServicePostMock.mockRejectedValueOnce(
        new Error(ErrorJob.WebhookWasNotSent),
      );

      const newSolution: WebhookDto = {
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        eventType: EventType.SUBMISSION_IN_REVIEW,
        eventData: { solutionsUrl: MOCK_FILE_URL },
      };

      await expect(
        jobService.processJobSolution(newSolution),
      ).rejects.toThrowError(ErrorJob.WebhookWasNotSent);
    });

    it('should return solution are recorded when one solution is sent', async () => {
      const escrowClient = {
        getRecordingOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
        getReputationOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Pending),
        getManifestUrl: jest
          .fn()
          .mockResolvedValue('http://example.com/manifest'),
        getIntermediateResultsUrl: jest.fn().mockResolvedValue(''),
        storeResults: jest.fn().mockResolvedValue(true),
      };
      (EscrowClient.build as jest.Mock).mockResolvedValue(escrowClient);

      const manifest: IManifest = {
        submissionsRequired: 3,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount: '10',
        requestType: JobRequestType.FORTUNE,
      };

      const existingJobSolutions: ISolution[] = [
        {
          workerAddress: '0x0000000000000000000000000000000000000000',
          solution: 'Solution 1',
        },
      ];
      const exchangeJobSolutions: ISolution[] = [
        {
          workerAddress: '0x0000000000000000000000000000000000000000',
          solution: 'Solution 1',
        },
        {
          workerAddress: '0x0000000000000000000000000000000000000001',
          solution: 'Solution 2',
        },
      ];

      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValueOnce(JSON.stringify(manifest))
        .mockResolvedValueOnce(JSON.stringify(existingJobSolutions))
        .mockResolvedValue(JSON.stringify(exchangeJobSolutions));

      const jobSolution: WebhookDto = {
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        eventType: EventType.SUBMISSION_IN_REVIEW,
        eventData: { solutionsUrl: MOCK_FILE_URL },
      };

      const result = await jobService.processJobSolution(jobSolution);
      expect(result).toEqual('Solutions recorded.');
      expect(httpServicePostMock).not.toHaveBeenCalled();
    });

    it('should call send webhook method when all solutions are recorded', async () => {
      const escrowClient = {
        getRecordingOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
        getReputationOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Pending),
        getManifestUrl: jest
          .fn()
          .mockResolvedValue('http://example.com/manifest'),
        getIntermediateResultsUrl: jest
          .fn()
          .mockResolvedValue('http://existing-solutions'),
        storeResults: jest.fn().mockResolvedValue(true),
      };
      (EscrowClient.build as jest.Mock).mockResolvedValue(escrowClient);

      const kvStoreClient = {
        get: jest.fn().mockResolvedValue(MOCK_REPUTATION_ORACLE_WEBHOOK_URL),
      };
      (KVStoreClient.build as jest.Mock).mockResolvedValue(kvStoreClient);

      const manifest: IManifest = {
        submissionsRequired: 2,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount: '10',
        requestType: JobRequestType.FORTUNE,
      };

      const existingJobSolutions: ISolution[] = [
        {
          workerAddress: '0x0000000000000000000000000000000000000000',
          solution: 'Solution 1',
        },
      ];
      const exchangeJobSolutions: ISolution[] = [
        {
          workerAddress: '0x0000000000000000000000000000000000000000',
          solution: 'Solution 1',
        },
        {
          workerAddress: '0x0000000000000000000000000000000000000001',
          solution: 'Solution 2',
        },
      ];

      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValueOnce(JSON.stringify(manifest))
        .mockResolvedValueOnce(JSON.stringify(existingJobSolutions))
        .mockResolvedValue(JSON.stringify(exchangeJobSolutions));

      const jobSolution: WebhookDto = {
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        eventType: EventType.SUBMISSION_IN_REVIEW,
        eventData: { solutionsUrl: MOCK_FILE_URL },
      };

      const result = await jobService.processJobSolution(jobSolution);

      const expectedBody = {
        chain_id: jobSolution.chainId,
        escrow_address: jobSolution.escrowAddress,
        event_type: EventType.ESCROW_RECORDED,
      };
      expect(result).toEqual('The requested job is completed.');
      expect(httpServicePostMock).toHaveBeenCalledWith(
        MOCK_REPUTATION_ORACLE_WEBHOOK_URL,
        expectedBody,
        {
          headers: {
            [HEADER_SIGNATURE_KEY]: await signMessage(
              expectedBody,
              MOCK_WEB3_PRIVATE_KEY,
            ),
          },
        },
      );
    });
  });

  it('should take one solution more when one is marked as invalid', async () => {
    const escrowClient = {
      getRecordingOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      getReputationOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      getStatus: jest.fn().mockResolvedValue(EscrowStatus.Pending),
      getManifestUrl: jest
        .fn()
        .mockResolvedValue('http://example.com/manifest'),
      getIntermediateResultsUrl: jest
        .fn()
        .mockResolvedValue('http://existing-solutions'),
      storeResults: jest.fn().mockResolvedValue(true),
    };
    (EscrowClient.build as jest.Mock).mockResolvedValue(escrowClient);

    const manifest: IManifest = {
      submissionsRequired: 4,
      requesterTitle: MOCK_REQUESTER_TITLE,
      requesterDescription: MOCK_REQUESTER_DESCRIPTION,
      fundAmount: '10',
      requestType: JobRequestType.FORTUNE,
    };

    const existingJobSolutions: ISolution[] = [
      {
        workerAddress: '0x0000000000000000000000000000000000000000',
        solution: 'Solution 1',
      },
    ];
    const exchangeJobSolutions: ISolution[] = [
      {
        workerAddress: '0x0000000000000000000000000000000000000000',
        solution: 'Solution 1',
      },
      {
        workerAddress: '0x0000000000000000000000000000000000000001',
        solution: 'Solution 2',
        error: true,
      },
      {
        workerAddress: '0x0000000000000000000000000000000000000002',
        solution: 'Solution 2',
      },
      {
        workerAddress: '0x0000000000000000000000000000000000000002',
        solution: 'Solution 3',
      },
      {
        workerAddress: '0x0000000000000000000000000000000000000003',
        solution: 'Solution 3',
      },
      {
        workerAddress: '0x0000000000000000000000000000000000000004',
        solution: 'Solution 4',
      },
    ];
    StorageClient.downloadFileFromUrl = jest
      .fn()
      .mockResolvedValueOnce(JSON.stringify(manifest))
      .mockResolvedValueOnce(JSON.stringify(existingJobSolutions))
      .mockResolvedValue(JSON.stringify(exchangeJobSolutions));

    const jobSolution: WebhookDto = {
      escrowAddress: MOCK_ADDRESS,
      chainId: ChainId.LOCALHOST,
      eventType: EventType.SUBMISSION_IN_REVIEW,
      eventData: { solutionsUrl: MOCK_FILE_URL },
    };

    const result = await jobService.processJobSolution(jobSolution);

    const expectedBody = {
      chain_id: jobSolution.chainId,
      escrow_address: jobSolution.escrowAddress,
      event_type: EventType.ESCROW_RECORDED,
    };
    expect(result).toEqual('The requested job is completed.');
    expect(httpServicePostMock).toHaveBeenCalledWith(
      MOCK_REPUTATION_ORACLE_WEBHOOK_URL,
      expectedBody,
      {
        headers: {
          [HEADER_SIGNATURE_KEY]: await signMessage(
            expectedBody,
            MOCK_WEB3_PRIVATE_KEY,
          ),
        },
      },
    );
  });

  it('should call exchange oracle endpoint when solution is wrong', async () => {
    const escrowClient = {
      getRecordingOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      getExchangeOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      getReputationOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      getStatus: jest.fn().mockResolvedValue(EscrowStatus.Pending),
      getManifestUrl: jest
        .fn()
        .mockResolvedValue('http://example.com/manifest'),
      getIntermediateResultsUrl: jest
        .fn()
        .mockResolvedValue('http://existing-solutions'),
      storeResults: jest.fn().mockResolvedValue(true),
    };
    (EscrowClient.build as jest.Mock).mockResolvedValue(escrowClient);
    (KVStoreClient.build as jest.Mock).mockResolvedValue({
      get: jest.fn().mockResolvedValue(MOCK_EXCHANGE_ORACLE_WEBHOOK_URL),
      getPublicKey: jest.fn().mockResolvedValue('publicKey'),
    });

    const manifest: IManifest = {
      submissionsRequired: 3,
      requesterTitle: MOCK_REQUESTER_TITLE,
      requesterDescription: MOCK_REQUESTER_DESCRIPTION,
      fundAmount: '10',
      requestType: JobRequestType.FORTUNE,
    };

    const existingJobSolutions: ISolution[] = [
      {
        workerAddress: MOCK_ADDRESS,
        solution: 'Solution 1',
      },
    ];
    const exchangeJobSolutions: ISolution[] = [
      {
        workerAddress: '0x0000000000000000000000000000000000000000',
        solution: 'Solution 1',
      },
      {
        workerAddress: '0x0000000000000000000000000000000000000000',
        solution: 'Solution 2',
      },
    ];
    StorageClient.downloadFileFromUrl = jest
      .fn()
      .mockResolvedValueOnce(JSON.stringify(manifest))
      .mockResolvedValueOnce(JSON.stringify(existingJobSolutions))
      .mockResolvedValue(JSON.stringify(exchangeJobSolutions));

    const jobSolution: WebhookDto = {
      escrowAddress: MOCK_ADDRESS,
      chainId: ChainId.LOCALHOST,
      eventType: EventType.SUBMISSION_IN_REVIEW,
      eventData: { solutionsUrl: MOCK_FILE_URL },
    };

    const result = await jobService.processJobSolution(jobSolution);

    const expectedBody = {
      chain_id: jobSolution.chainId,
      escrow_address: jobSolution.escrowAddress,
      event_type: EventType.SUBMISSION_REJECTED,
      event_data: {
        assignments: [
          {
            assignee_id: exchangeJobSolutions[0].workerAddress,
            reason: SolutionError.Duplicated,
          },
        ],
      },
    };
    expect(result).toEqual('Solutions recorded.');
    expect(httpServicePostMock).toHaveBeenCalledWith(
      MOCK_EXCHANGE_ORACLE_WEBHOOK_URL,
      expectedBody,
      {
        headers: {
          [HEADER_SIGNATURE_KEY]: expect.any(String),
        },
      },
    );
  });

  it('should call exchange oracle endpoint when solution contain bad words', async () => {
    const escrowClient = {
      getRecordingOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      getExchangeOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      getReputationOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      getStatus: jest.fn().mockResolvedValue(EscrowStatus.Pending),
      getManifestUrl: jest
        .fn()
        .mockResolvedValue('http://example.com/manifest'),
      getIntermediateResultsUrl: jest
        .fn()
        .mockResolvedValue('http://existing-solutions'),
      storeResults: jest.fn().mockResolvedValue(true),
    };
    (EscrowClient.build as jest.Mock).mockResolvedValue(escrowClient);
    (KVStoreClient.build as jest.Mock).mockResolvedValue({
      get: jest.fn().mockResolvedValue(MOCK_EXCHANGE_ORACLE_WEBHOOK_URL),
      getPublicKey: jest.fn().mockResolvedValue('publicKey'),
    });

    const manifest: IManifest = {
      submissionsRequired: 3,
      requesterTitle: MOCK_REQUESTER_TITLE,
      requesterDescription: MOCK_REQUESTER_DESCRIPTION,
      fundAmount: '10',
      requestType: JobRequestType.FORTUNE,
    };

    const existingJobSolutions: ISolution[] = [
      {
        workerAddress: MOCK_ADDRESS,
        solution: 'Solution 1',
      },
    ];
    const exchangeJobSolutions: ISolution[] = [
      {
        workerAddress: '0x0000000000000000000000000000000000000000',
        solution: 'Solution 1',
      },
      {
        workerAddress: '0x0000000000000000000000000000000000000001',
        solution: 'ass',
      },
    ];
    StorageClient.downloadFileFromUrl = jest
      .fn()
      .mockResolvedValueOnce(JSON.stringify(manifest))
      .mockResolvedValueOnce(JSON.stringify(existingJobSolutions))
      .mockResolvedValue(JSON.stringify(exchangeJobSolutions));

    const jobSolution: WebhookDto = {
      escrowAddress: MOCK_ADDRESS,
      chainId: ChainId.LOCALHOST,
      eventType: EventType.SUBMISSION_IN_REVIEW,
      eventData: { solutionsUrl: MOCK_FILE_URL },
    };

    const expectedBody = {
      chain_id: jobSolution.chainId,
      escrow_address: jobSolution.escrowAddress,
      event_type: EventType.SUBMISSION_REJECTED,
      event_data: {
        assignments: [
          {
            assignee_id: exchangeJobSolutions[1].workerAddress,
            reason: SolutionError.CurseWord,
          },
        ],
      },
    };
    const result = await jobService.processJobSolution(jobSolution);
    expect(result).toEqual('Solutions recorded.');
    expect(httpServicePostMock).toHaveBeenCalledWith(
      MOCK_EXCHANGE_ORACLE_WEBHOOK_URL,
      expectedBody,
      {
        headers: {
          [HEADER_SIGNATURE_KEY]: expect.any(String),
        },
      },
    );
  });
});
