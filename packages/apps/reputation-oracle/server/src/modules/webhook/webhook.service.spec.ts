import { Test } from '@nestjs/testing';
import { WebhookService } from './webhook.service';
import { WebhookRepository } from './webhook.repository';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { createMock } from '@golevelup/ts-jest';
import { ReputationService } from '../reputation/reputation.service';
import {
  CvatManifestDto,
  FortuneFinalResult,
  FortuneManifestDto,
  ProcessingResultDto,
  WebhookIncomingDto,
} from './webhook.dto';
import { ChainId, EscrowClient, StorageClient } from '@human-protocol/sdk';
import { WebhookIncomingEntity } from './webhook-incoming.entity';
import { BigNumber } from 'ethers';
import { ReputationRepository } from '../reputation/reputation.repository';
import { ErrorWebhook } from '../../common/constants/errors';
import {
  EventType,
  JobRequestType,
  ReputationEntityType,
  SolutionError,
} from '../../common/enums';
import {
  MOCK_ADDRESS,
  MOCK_BUCKET_NAME,
  MOCK_EXCHANGE_ORACLE_ADDRESS,
  MOCK_FILE_HASH,
  MOCK_FILE_KEY,
  MOCK_FILE_URL,
  MOCK_JOB_LAUNCHER_ADDRESS,
  MOCK_PRIVATE_KEY,
  MOCK_RECORDING_ORACLE_ADDRESS,
  MOCK_REQUESTER_DESCRIPTION,
  MOCK_REQUESTER_TITLE,
} from '../../../test/constants';
import { WebhookStatus } from '../../common/enums';
import { RETRIES_COUNT_THRESHOLD } from '../../common/constants';
import { Web3Service } from '../web3/web3.service';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowClient: {
    build: jest.fn().mockImplementation(() => ({
      getIntermediateResultsUrl: jest.fn().mockResolvedValue(MOCK_FILE_URL),
      getManifestUrl: jest.fn().mockResolvedValue(MOCK_FILE_URL),
      getResultsUrl: jest.fn().mockResolvedValue(MOCK_FILE_URL),
      bulkPayOut: jest.fn().mockResolvedValue(true),
    })),
  },
  StorageClient: jest.fn().mockImplementation(() => ({
    uploadFiles: jest
      .fn()
      .mockResolvedValue([
        { key: MOCK_FILE_KEY, url: MOCK_FILE_URL, hash: MOCK_FILE_HASH },
      ]),
    downloadFileFromUrl: jest.fn(),
  })),
}));

jest.mock('../../common/utils', () => ({
  ...jest.requireActual('../../common/utils'),
  copyFileFromURLToBucket: jest.fn().mockImplementation(() => {
    return { url: MOCK_FILE_URL, hash: MOCK_FILE_HASH };
  }),
}));

describe('WebhookService', () => {
  let webhookService: WebhookService,
    webhookRepository: WebhookRepository,
    reputationService: ReputationService;

  const signerMock = {
    address: MOCK_ADDRESS,
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  beforeEach(async () => {
    const mockConfigService: Partial<ConfigService> = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'S3_ENDPOINT':
            return '127.0.0.1';
          case 'S3_PORT':
            return 9000;
          case 'S3_USE_SSL':
            return false;
          case 'HOST':
            return '127.0.0.1';
          case 'PORT':
            return 5000;
          case 'WEB3_PRIVATE_KEY':
            return MOCK_PRIVATE_KEY;
          case 'S3_BUCKET':
            return MOCK_BUCKET_NAME;
        }
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        WebhookService,
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
          },
        },
        ReputationService,
        {
          provide: ReputationRepository,
          useValue: createMock<ReputationRepository>(),
        },
        {
          provide: WebhookRepository,
          useValue: createMock<WebhookRepository>(),
        },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: createMock<HttpService>() },
      ],
    }).compile();

    webhookService = moduleRef.get<WebhookService>(WebhookService);
    webhookRepository = moduleRef.get(WebhookRepository);
    reputationService = moduleRef.get(ReputationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createIncomingWebhook', () => {
    const dto: WebhookIncomingDto = {
      chainId: ChainId.LOCALHOST,
      eventType: EventType.TASK_FINISHED,
      escrowAddress: MOCK_ADDRESS,
    };

    it('should create an incoming webhook entity', async () => {
      const webhookEntity: Partial<WebhookIncomingEntity> = {
        id: 1,
        chainId: dto.chainId,
        escrowAddress: dto.escrowAddress,
        status: WebhookStatus.PENDING,
        waitUntil: new Date(),
      };

      jest
        .spyOn(webhookRepository, 'create')
        .mockResolvedValueOnce(webhookEntity as WebhookIncomingEntity);

      const result = await webhookService.createIncomingWebhook(dto);

      expect(webhookRepository.create).toHaveBeenCalledWith({
        chainId: dto.chainId,
        escrowAddress: dto.escrowAddress,
        retriesCount: 0,
        status: WebhookStatus.PENDING,
        waitUntil: expect.any(Date),
      });
      expect(result).toBe(true);
    });

    it('should throw an error if incoming webhook entity is not created', async () => {
      jest
        .spyOn(webhookRepository, 'create')
        .mockResolvedValueOnce(undefined as any);

      await expect(
        webhookService.createIncomingWebhook(dto),
      ).rejects.toThrowError(ErrorWebhook.NotCreated);
    });

    it('should throw an error if an error occurs', async () => {
      jest
        .spyOn(webhookRepository, 'create')
        .mockRejectedValueOnce(new Error());

      await expect(
        webhookService.createIncomingWebhook(dto),
      ).rejects.toThrowError();
    });
  });

  describe('processPendingCronJob', () => {
    const fortuneManifest: FortuneManifestDto = {
      submissionsRequired: 1,
      requesterTitle: MOCK_REQUESTER_TITLE,
      requesterDescription: MOCK_REQUESTER_DESCRIPTION,
      fundAmount: 10,
      requestType: JobRequestType.FORTUNE,
    };

    const cvatManifest: CvatManifestDto = {
      data: {
        data_url: MOCK_FILE_URL,
      },
      annotation: {
        labels: [{ name: 'cat' }, { name: 'dog' }],
        description: 'Description',
        type: JobRequestType.IMAGE_BOXES,
        job_size: 10,
        max_time: 10,
      },
      validation: {
        min_quality: 0.95,
        val_size: 10,
        gt_url: MOCK_FILE_URL,
      },
      job_bounty: '10',
    };

    const webhookEntity: Partial<WebhookIncomingEntity> = {
      id: 1,
      chainId: ChainId.LOCALHOST,
      escrowAddress: MOCK_ADDRESS,
      status: WebhookStatus.PENDING,
      waitUntil: new Date(),
    };

    const results: ProcessingResultDto = {
      recipients: [MOCK_ADDRESS],
      amounts: [BigNumber.from(10)],
      url: MOCK_FILE_URL,
      hash: MOCK_FILE_HASH,
      checkPassed: true,
    };

    it('should return false if no pending webhook is found', async () => {
      webhookRepository.findOne = jest.fn().mockReturnValue(null);
      expect(await webhookService.processPendingCronJob()).toBe(false);
    });

    it('should handle error if any exception is thrown', async () => {
      webhookRepository.findOne = jest.fn().mockReturnValue(webhookEntity);
      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockReturnValueOnce(fortuneManifest);
      jest.spyOn(webhookService, 'handleWebhookError').mockResolvedValue(false);

      jest.spyOn(webhookService, 'processFortune').mockImplementation(() => {
        throw new Error();
      });

      expect(await webhookService.processPendingCronJob()).toBe(false);
      expect(webhookService.handleWebhookError).toBeCalled();
    });

    it('should successfully process a Fortune manifest', async () => {
      webhookRepository.findOne = jest.fn().mockReturnValue(webhookEntity);
      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockReturnValueOnce(fortuneManifest);
      jest
        .spyOn(webhookService, 'processFortune')
        .mockResolvedValue(results as any);

      expect(await webhookService.processPendingCronJob()).toBe(true);
    });

    it('should successfully process a CVAT manifest', async () => {
      webhookRepository.findOne = jest.fn().mockReturnValue(cvatManifest);
      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockReturnValueOnce(cvatManifest);
      jest
        .spyOn(webhookService, 'processCvat')
        .mockResolvedValue(results as any);

      expect(await webhookService.processPendingCronJob()).toBe(true);
    });
  });

  describe('handleWebhookError', () => {
    it('should set webhook status to FAILED if retries exceed threshold', async () => {
      await webhookService.handleWebhookError(
        { id: 1, retriesCount: RETRIES_COUNT_THRESHOLD } as any,
        new Error('Sample error'),
      );
      expect(webhookRepository.updateOne).toHaveBeenCalledWith(
        { id: 1 },
        { status: WebhookStatus.FAILED },
      );
    });

    it('should increment retries count if below threshold', async () => {
      await webhookService.handleWebhookError(
        { id: 1, retriesCount: 0 } as any,
        new Error('Sample error'),
      );
      expect(webhookRepository.updateOne).toHaveBeenCalledWith(
        { id: 1 },
        {
          retriesCount: 1,
          waitUntil: expect.any(Date),
        },
      );
    });
  });

  describe('processFortune', () => {
    it('should successfully process and return correct result values', async () => {
      const manifest = {
        submissionsRequired: 1,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount: 10,
        requestType: JobRequestType.FORTUNE,
      };

      const intermediateResults = [
        {
          exchangeAddress: 'string',
          workerAddress: 'string',
          solution: 'string',
        },
      ];

      const intermediateResultsUrl = MOCK_FILE_URL;

      jest
        .spyOn(webhookService as any, 'getIntermediateResults')
        .mockResolvedValue(intermediateResults);
      jest
        .spyOn(webhookService.storageClient, 'uploadFiles')
        .mockResolvedValue([
          { url: MOCK_FILE_URL, hash: MOCK_FILE_HASH },
        ] as any);

      const result = await webhookService.processFortune(
        manifest,
        intermediateResultsUrl,
      );
      expect(result).toEqual({
        recipients: expect.any(Array),
        amounts: expect.any(Array),
        url: MOCK_FILE_URL,
        hash: MOCK_FILE_HASH,
        checkPassed: expect.any(Boolean),
      });
    });
  });

  describe('processCvat', () => {
    const manifest = {
      data: {
        data_url: MOCK_FILE_URL,
      },
      annotation: {
        labels: [{ name: 'cat' }, { name: 'dog' }],
        description: 'Description',
        type: JobRequestType.IMAGE_BOXES,
        job_size: 10,
        max_time: 10,
      },
      validation: {
        min_quality: 0.95,
        val_size: 10,
        gt_url: MOCK_FILE_URL,
      },
      job_bounty: '10',
    };

    it('should successfully process and return correct result values', async () => {
      const intermediateResultsUrl = MOCK_FILE_URL;
      StorageClient.downloadFileFromUrl = jest.fn().mockReturnValueOnce({
        jobs: [
          {
            id: 1,
            job_id: 1,
            annotator_wallet_address: MOCK_ADDRESS,
            annotation_quality: 0.96,
          },
        ],
        results: [
          {
            id: 2,
            job_id: 2,
            annotator_wallet_address: MOCK_ADDRESS,
            annotation_quality: 0.96,
          },
        ],
      });

      const result = await webhookService.processCvat(
        manifest as any,
        intermediateResultsUrl,
      );
      expect(result).toEqual({
        recipients: expect.any(Array),
        amounts: expect.any(Array),
        url: expect.any(String),
        hash: expect.any(String),
        checkPassed: true,
      });
    });
  });

  describe('processPaidCronJob', () => {
    const fortuneManifest: FortuneManifestDto = {
      submissionsRequired: 1,
      requesterTitle: MOCK_REQUESTER_TITLE,
      requesterDescription: MOCK_REQUESTER_DESCRIPTION,
      fundAmount: 10,
      requestType: JobRequestType.FORTUNE,
    };

    const cvatManifest: CvatManifestDto = {
      data: {
        data_url: MOCK_FILE_URL,
      },
      annotation: {
        labels: [{ name: 'cat' }, { name: 'dog' }],
        description: 'Description',
        type: JobRequestType.IMAGE_BOXES,
        job_size: 10,
        max_time: 10,
      },
      validation: {
        min_quality: 0.95,
        val_size: 10,
        gt_url: MOCK_FILE_URL,
      },
      job_bounty: '10',
    };

    const webhookEntity: Partial<WebhookIncomingEntity> = {
      id: 1,
      chainId: ChainId.LOCALHOST,
      escrowAddress: MOCK_ADDRESS,
      status: WebhookStatus.PAID,
      checkPassed: true,
      waitUntil: new Date(),
    };

    it('should return false if no pending webhook is found', async () => {
      webhookRepository.findOne = jest.fn().mockReturnValue(null);
      expect(await webhookService.processPaidCronJob()).toBe(false);
    });

    it('should handle error if any exception is thrown', async () => {
      webhookRepository.findOne = jest.fn().mockReturnValue(webhookEntity);
      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockReturnValueOnce(fortuneManifest);
      jest.spyOn(webhookService, 'handleWebhookError').mockResolvedValue(false);

      (EscrowClient.build as any).mockImplementation(() => ({
        getResultsUrl: jest.fn().mockImplementation(() => {
          throw new Error();
        }),
      }));

      expect(await webhookService.processPaidCronJob()).toBe(false);
      expect(webhookService.handleWebhookError).toBeCalled();
    });

    it('should successfully process Fortune reputations', async () => {
      const worker1 = '0xCf88b3f1992458C2f5a229573c768D0E9F70C440';
      const worker2 = '0xCf88b3f1992458C2f5a229573c768D0E9F70C443';
      webhookRepository.findOne = jest.fn().mockReturnValue(webhookEntity);
      const finalResults: FortuneFinalResult[] = [
        { solution: 'Solution', workerAddress: worker1 },
        {
          solution: 'Solution',
          workerAddress: worker2,
          error: SolutionError.Duplicated,
        },
      ];
      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValueOnce(fortuneManifest)
        .mockResolvedValue(finalResults);

      (EscrowClient.build as any).mockImplementation(() => ({
        getManifestUrl: jest.fn().mockResolvedValue(MOCK_FILE_URL),
        getResultsUrl: jest.fn().mockResolvedValue(MOCK_FILE_URL),
        getJobLauncherAddress: jest
          .fn()
          .mockResolvedValue(MOCK_JOB_LAUNCHER_ADDRESS),
        getExchangeOracleAddress: jest
          .fn()
          .mockResolvedValue(MOCK_EXCHANGE_ORACLE_ADDRESS),
        getRecordingOracleAddress: jest
          .fn()
          .mockResolvedValue(MOCK_RECORDING_ORACLE_ADDRESS),
      }));

      jest.spyOn(reputationService, 'increaseReputation');
      jest.spyOn(reputationService, 'decreaseReputation');

      expect(await webhookService.processPaidCronJob()).toBe(true);
      expect(reputationService.increaseReputation).toHaveBeenCalledWith(
        ChainId.LOCALHOST,
        worker1,
        ReputationEntityType.WORKER,
      );
      expect(reputationService.decreaseReputation).toHaveBeenCalledWith(
        ChainId.LOCALHOST,
        worker2,
        ReputationEntityType.WORKER,
      );
      expect(reputationService.increaseReputation).toHaveBeenCalledWith(
        ChainId.LOCALHOST,
        MOCK_JOB_LAUNCHER_ADDRESS,
        ReputationEntityType.JOB_LAUNCHER,
      );
      expect(reputationService.decreaseReputation).toHaveBeenCalledWith(
        ChainId.LOCALHOST,
        MOCK_EXCHANGE_ORACLE_ADDRESS,
        ReputationEntityType.EXCHANGE_ORACLE,
      );
      expect(reputationService.increaseReputation).toHaveBeenCalledWith(
        ChainId.LOCALHOST,
        MOCK_RECORDING_ORACLE_ADDRESS,
        ReputationEntityType.RECORDING_ORACLE,
      );
    });

    it('should successfully process CVAT reputations', async () => {
      webhookRepository.findOne = jest.fn().mockReturnValue(webhookEntity);
      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValueOnce(cvatManifest);

      (EscrowClient.build as any).mockImplementation(() => ({
        getManifestUrl: jest.fn().mockResolvedValue(MOCK_FILE_URL),
        getResultsUrl: jest.fn().mockResolvedValue(MOCK_FILE_URL),
        getJobLauncherAddress: jest
          .fn()
          .mockResolvedValue(MOCK_JOB_LAUNCHER_ADDRESS),
        getExchangeOracleAddress: jest
          .fn()
          .mockResolvedValue(MOCK_EXCHANGE_ORACLE_ADDRESS),
        getRecordingOracleAddress: jest
          .fn()
          .mockResolvedValue(MOCK_RECORDING_ORACLE_ADDRESS),
      }));

      jest.spyOn(reputationService, 'increaseReputation');
      jest.spyOn(reputationService, 'decreaseReputation');

      expect(await webhookService.processPaidCronJob()).toBe(true);
      expect(reputationService.increaseReputation).toHaveBeenCalledWith(
        ChainId.LOCALHOST,
        MOCK_JOB_LAUNCHER_ADDRESS,
        ReputationEntityType.JOB_LAUNCHER,
      );
      expect(reputationService.increaseReputation).toHaveBeenCalledWith(
        ChainId.LOCALHOST,
        MOCK_EXCHANGE_ORACLE_ADDRESS,
        ReputationEntityType.EXCHANGE_ORACLE,
      );
      expect(reputationService.increaseReputation).toHaveBeenCalledWith(
        ChainId.LOCALHOST,
        MOCK_RECORDING_ORACLE_ADDRESS,
        ReputationEntityType.RECORDING_ORACLE,
      );
      expect(reputationService.decreaseReputation).not.toHaveBeenCalled();
    });
  });
});
