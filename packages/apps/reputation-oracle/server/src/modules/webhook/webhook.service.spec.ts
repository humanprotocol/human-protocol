import { Test } from '@nestjs/testing';
import { WebhookService } from './webhook.service';
import { WebhookRepository } from './webhook.repository';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { createMock } from '@golevelup/ts-jest';
import { ReputationService } from '../reputation/reputation.service';
import {
  FortuneFinalResult,
  ImageLabelBinaryJobResults,
  ManifestDto,
  WebhookIncomingDto,
} from './webhook.dto';
import {
  ChainId,
  EscrowClient,
  NETWORKS,
  StorageClient,
} from '@human-protocol/sdk';
import { WebhookIncomingEntity } from './webhook-incoming.entity';
import { BigNumber, ethers } from 'ethers';
import { ReputationRepository } from '../reputation/reputation.repository';
import {
  ErrorManifest,
  ErrorResults,
  ErrorWebhook,
} from '../../common/constants/errors';
import { JobRequestType } from '../../common/enums';
import {
  MOCK_ADDRESS,
  MOCK_BUCKET_NAME,
  MOCK_FILE_HASH,
  MOCK_FILE_KEY,
  MOCK_FILE_URL, MOCK_IMAGE_BINARY_LABEL_JOB_RESULTS,
  MOCK_JOB_LAUNCHER_FEE,
  MOCK_LABEL, MOCK_LABEL_NEGATIVE,
  MOCK_PRIVATE_KEY,
  MOCK_RECORDING_ORACLE_FEE,
  MOCK_REPUTATION_ORACLE_FEE,
  MOCK_REQUESTER_DESCRIPTION,
  MOCK_REQUESTER_TITLE,
} from '../../../test/constants';
import { WebhookStatus } from '../../common/enums';
import { RETRIES_COUNT_THRESHOLD } from '../../common/constants';
import { Web3Service } from '../web3/web3.service';

jest.mock('@human-protocol/sdk');

describe('WebhookService', () => {
  let webhookService: WebhookService,
    reputationService: ReputationService,
    webhookRepository: WebhookRepository;

  const signerMock = {
    address: MOCK_ADDRESS,
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  const fundAmountInWei = ethers.utils.parseUnits(
    '10', // ETH
    'ether',
  );

  const totalFeePercentage = BigNumber.from(MOCK_JOB_LAUNCHER_FEE)
    .add(MOCK_RECORDING_ORACLE_FEE)
    .add(MOCK_REPUTATION_ORACLE_FEE);
  const totalFee = BigNumber.from(fundAmountInWei)
    .mul(totalFeePercentage)
    .div(100);
  const totalAmount = BigNumber.from(fundAmountInWei).add(totalFee);

  beforeAll(async () => {
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
            return MOCK_BUCKET_NAME
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
    reputationService = moduleRef.get<ReputationService>(ReputationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createIncomingWebhook', () => {
    const dto: WebhookIncomingDto = {
      chainId: ChainId.LOCALHOST,
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

  describe('call processPendingWebhook on job request type fortune', () => {
    let manifest: ManifestDto,
        webhookEntity: Partial<WebhookIncomingEntity>,
        intermediateResults: FortuneFinalResult[];

    beforeEach(async () => {
      manifest = {
        requestType: JobRequestType.FORTUNE, // fortune job type
        submissionsRequired: 10,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fee: totalFee.toString(),
        fundAmount: totalAmount.toString(),
      };
  
      webhookEntity = {
        id: 1,
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        status: WebhookStatus.PENDING,
        waitUntil: new Date(),
      };
  
      intermediateResults = [
        {
          exchangeAddress: 'string',
          workerAddress: 'string',
          solution: 'string',
        },
      ];
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should process a pending webhook and return true', async () => {
      const uploadFilesSpy = jest
        .spyOn(StorageClient.prototype, 'uploadFiles')
        .mockResolvedValueOnce([
          { key: MOCK_FILE_KEY, url: MOCK_FILE_URL, hash: MOCK_FILE_HASH },
        ]);
      
      (EscrowClient.build as any).mockImplementation(() => ({
        storeResults: jest
          .fn()
          .mockResolvedValueOnce(undefined),
        bulkPayOut: jest
          .fn()
          .mockResolvedValueOnce(undefined),
        getManifestUrl: jest
          .fn()
          .mockResolvedValueOnce(MOCK_FILE_URL),
      }));

      jest
        .spyOn(webhookService, 'getIntermediateResults')
        .mockResolvedValueOnce(intermediateResults);

      const updateOneSpy = jest
        .spyOn(webhookRepository, 'updateOne')
        .mockResolvedValueOnce(webhookEntity as WebhookIncomingEntity);

      jest
        .spyOn(StorageClient, 'downloadFileFromUrl')
        .mockResolvedValueOnce(manifest);
      jest
        .spyOn(webhookService, 'finalizeFortuneResults')
        .mockResolvedValueOnce(intermediateResults);

      const result = await webhookService.processPendingWebhook(
        webhookEntity as WebhookIncomingEntity,
      );

      expect(webhookService.finalizeFortuneResults).toHaveBeenCalledWith(
        intermediateResults,
      );
      expect(uploadFilesSpy).toHaveBeenCalledWith(
        [intermediateResults],
        webhookService.bucket,
      );
      expect(updateOneSpy).toHaveBeenCalledWith(
        { id: webhookEntity.id },
        {
          resultsUrl: MOCK_FILE_URL,
          checkPassed: expect.any(Boolean),
          status: WebhookStatus.PAID,
          retriesCount: 0,
        },
      );
      expect(result).toBe(true);
    });

    it('should process a pending webhook, update status to FAILED, and return false if retries count exceeds threshold', async () => {
      webhookEntity.retriesCount = RETRIES_COUNT_THRESHOLD;

      const updateOneMock = jest
        .spyOn(webhookRepository, 'updateOne')
        .mockResolvedValueOnce(undefined as any);

      (EscrowClient.build as any).mockImplementation(() => ({
        getManifestUrl: jest
          .fn()
          .mockRejectedValueOnce(new Error())
      }));

      const result = await webhookService.processPendingWebhook(
        webhookEntity as WebhookIncomingEntity,
      );
      expect(updateOneMock).toHaveBeenCalledWith(
        { id: webhookEntity.id },
        { status: WebhookStatus.FAILED },
      );
      expect(result).toBe(false);
    });

    it('should process a pending webhook, update retries count and waitUntil date, and return false if an error occurs', async () => {
      webhookEntity.retriesCount = 1;
      const updateOneSpy = jest
        .spyOn(webhookRepository, 'updateOne')
        .mockResolvedValueOnce(undefined as any);

      (EscrowClient.build as any).mockImplementation(() => ({
        getManifestUrl: jest
          .fn()
          .mockRejectedValueOnce(new Error(ErrorManifest.ManifestUrlDoesNotExist))
      }));

      const result = await webhookService.processPendingWebhook(
        webhookEntity as WebhookIncomingEntity,
      );

      expect(updateOneSpy).toHaveBeenCalledWith(
        { id: webhookEntity.id },
        {
          retriesCount: (webhookEntity.retriesCount as number) + 1,
          waitUntil: expect.any(Date),
        },
      );
      expect(result).toBe(false);
    });

    it('should throw an error if no intermediate results are found', async () => {
      (EscrowClient.build as any).mockImplementation(() => ({
        getManifestUrl: jest
          .fn()
          .mockResolvedValueOnce(MOCK_FILE_URL)
      }));

      jest
        .spyOn(webhookService, 'finalizeFortuneResults')
        .mockResolvedValueOnce(intermediateResults);

      jest
        .spyOn(StorageClient, 'downloadFileFromUrl')
        .mockResolvedValueOnce({} as any)
        .mockRejectedValueOnce(
          new Error(ErrorResults.NoIntermediateResultsFound),
        );
      
      jest
        .spyOn(webhookService, 'getIntermediateResults')
        .mockRejectedValueOnce(new Error(ErrorResults.NoIntermediateResultsFound));

      const result = await webhookService.processPendingWebhook(
        webhookEntity as WebhookIncomingEntity,
      );
      expect(result).toBe(false);
    });
  });

  describe.skip('call processPendingWebhook on job request type image label binary', () => {
    let manifest: ManifestDto,
        webhookEntity: Partial<WebhookIncomingEntity>,
        intermediateResults: ImageLabelBinaryJobResults;

    beforeEach(async () => {
      manifest = {
        dataUrl: MOCK_FILE_URL,
        labels: [MOCK_LABEL_NEGATIVE, MOCK_LABEL],
        requestType: JobRequestType.IMAGE_LABEL_BINARY, // image label binary job type
        submissionsRequired: 1,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        requesterAccuracyTarget: 10,
        fee: totalFee.toString(),
        fundAmount: totalAmount.toString(),
      };
  
      webhookEntity = {
        id: 1,
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        status: WebhookStatus.PENDING,
        waitUntil: new Date(),
      };
  
      intermediateResults = MOCK_IMAGE_BINARY_LABEL_JOB_RESULTS;
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should process a pending webhook and return true', async () => {
      const uploadFilesSpy = jest.spyOn(webhookService.storageClient, 'uploadFiles')
          .mockResolvedValueOnce([
            { key: MOCK_FILE_KEY, url: MOCK_FILE_URL, hash: MOCK_FILE_HASH },
          ]);

      (EscrowClient.build as any).mockImplementation(() => ({
        storeResults: jest
          .fn()
          .mockResolvedValueOnce(undefined),
        bulkPayOut: jest
          .fn()
          .mockResolvedValueOnce(undefined),
        getManifestUrl: jest
          .fn()
          .mockResolvedValueOnce(MOCK_FILE_URL),
      }));

      jest
        .spyOn(webhookService, 'getIntermediateResults')
        .mockResolvedValueOnce(intermediateResults);

      const updateOneSpy = jest
        .spyOn(webhookRepository, 'updateOne')
        .mockResolvedValueOnce(webhookEntity as WebhookIncomingEntity);
  
      jest
        .spyOn(StorageClient, 'downloadFileFromUrl')
        .mockResolvedValueOnce(manifest);

      const result = await webhookService.processPendingWebhook(
        webhookEntity as WebhookIncomingEntity,
      );

      expect(uploadFilesSpy).toHaveBeenCalledWith(
        [intermediateResults],
        webhookService.bucket,
      );
  
      expect(updateOneSpy).toHaveBeenCalledWith(
        { id: webhookEntity.id },
        {
          resultsUrl: MOCK_FILE_URL,
          checkPassed: expect.any(Boolean),
          status: WebhookStatus.PAID,
          retriesCount: 0,
        },
      );
      expect(result).toBe(true);
    });

    it('should process a pending webhook, update status to FAILED, and return false if retries count exceeds threshold', async () => {
      webhookEntity.retriesCount = RETRIES_COUNT_THRESHOLD;

      const updateOneMock = jest
        .spyOn(webhookRepository, 'updateOne')
        .mockResolvedValueOnce(undefined as any);

      (EscrowClient.build as any).mockImplementation(() => ({
        getManifestUrl: jest
          .fn()
          .mockRejectedValueOnce(new Error())
      }));

      const result = await webhookService.processPendingWebhook(
        webhookEntity as WebhookIncomingEntity,
      );

      expect(updateOneMock).toHaveBeenCalledWith(
        { id: webhookEntity.id },
        { status: WebhookStatus.FAILED },
      );
      expect(result).toBe(false);
    });

    it('should process a pending webhook, update retries count and waitUntil date, and return false if an error occurs', async () => {
      webhookEntity.retriesCount = 1;
      const updateOneSpy = jest
        .spyOn(webhookRepository, 'updateOne')
        .mockResolvedValueOnce(undefined as any);

      (EscrowClient.build as any).mockImplementation(() => ({
        getManifestUrl: jest
          .fn()
          .mockRejectedValueOnce(new Error(ErrorManifest.ManifestUrlDoesNotExist))
      }));

      const result = await webhookService.processPendingWebhook(
        webhookEntity as WebhookIncomingEntity,
      );

      expect(updateOneSpy).toHaveBeenCalledWith(
        { id: webhookEntity.id },
        {
          retriesCount: (webhookEntity.retriesCount as number) + 1,
          waitUntil: expect.any(Date),
        },
      );
      expect(result).toBe(false);
    });

    it('should throw an error if no intermediate results are found', async () => {
      (EscrowClient.build as any).mockImplementation(() => ({
        getManifestUrl: jest
          .fn()
          .mockResolvedValueOnce(MOCK_FILE_URL)
      }));

      jest
        .spyOn(webhookService, 'getIntermediateResults')
        .mockRejectedValueOnce(new Error(ErrorResults.NoIntermediateResultsFound));
        
      jest
        .spyOn(StorageClient, 'downloadFileFromUrl')
        .mockResolvedValueOnce({} as any)
        .mockRejectedValueOnce(
          new Error(ErrorResults.NoIntermediateResultsFound),
        );

      const result = await webhookService.processPendingWebhook(
        webhookEntity as WebhookIncomingEntity,
      );
      expect(result).toBe(false);
    });
  });

  describe.skip('processPaidWebhook', () => {
    const manifest: ManifestDto = {
      requestType: JobRequestType.FORTUNE,
      submissionsRequired: 10,
      requesterTitle: MOCK_REQUESTER_TITLE,
      requesterDescription: MOCK_REQUESTER_DESCRIPTION,
      fee: totalFee.toString(),
      fundAmount: totalAmount.toString(),
    };

    const webhookEntity: Partial<WebhookIncomingEntity> = {
      id: 1,
      chainId: ChainId.LOCALHOST,
      escrowAddress: MOCK_ADDRESS,
      status: WebhookStatus.PAID,
      retriesCount: 0,
    };

    it('should process a paid webhook and return true', async () => {
      const finalResultsUrl = MOCK_FILE_URL;

      const increaseReputationSpy = jest
        .spyOn(reputationService, 'increaseReputation')
        .mockResolvedValueOnce(undefined);
      const updateOneSpy = jest
        .spyOn(webhookRepository, 'updateOne')
        .mockResolvedValueOnce(undefined as any);

      (EscrowClient.build as any).mockImplementation(() => ({
        getResultsUrl: jest
          .fn()
          .mockResolvedValueOnce(finalResultsUrl),
        getManifestUrl: jest
          .fn()
          .mockResolvedValueOnce(MOCK_FILE_URL),
        getRecordingOracleAddress: jest
          .fn()
          .mockResolvedValueOnce('recording-oracle-address'),
      }));

      jest
        .spyOn(StorageClient, 'downloadFileFromUrl')
        .mockResolvedValueOnce(manifest);

      const result = await webhookService.processPaidWebhook(
        webhookEntity as WebhookIncomingEntity,
      );

      expect(StorageClient.downloadFileFromUrl).toHaveBeenCalledWith(
        finalResultsUrl,
      );
      expect(increaseReputationSpy).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(String),
        expect.any(String),
      );
      expect(updateOneSpy).toHaveBeenCalledWith(
        { id: webhookEntity.id },
        { status: WebhookStatus.COMPLETED },
      );
      expect(result).toBe(true);
    });

    it('should process a paid webhook, decrease reputation, and return true if checkPassed is false', async () => {
      const finalResultsUrl = MOCK_FILE_URL;
      const finalResults: FortuneFinalResult[] = [
        {
          exchangeAddress: 'string',
          workerAddress: 'string',
          solution: 'string',
        },
        {
          exchangeAddress: 'string',
          workerAddress: 'string',
          solution: 'string',
        },
      ];

      const decreaseReputationSpy = jest
        .spyOn(reputationService, 'decreaseReputation')
        .mockResolvedValueOnce(undefined);
      jest
        .spyOn(webhookRepository, 'updateOne')
        .mockResolvedValueOnce(undefined as any);

      (EscrowClient.build as any).mockImplementation(() => ({
        getResultsUrl: jest
          .fn()
          .mockResolvedValueOnce(finalResultsUrl),
        getManifestUrl: jest
          .fn()
          .mockResolvedValueOnce(MOCK_FILE_URL),
        getRecordingOracleAddress: jest
          .fn()
          .mockResolvedValueOnce('recording-oracle-address'),
      }));

      jest
        .spyOn(StorageClient, 'downloadFileFromUrl')
        .mockResolvedValueOnce(finalResults);
      jest
        .spyOn(StorageClient, 'downloadFileFromUrl')
        .mockResolvedValueOnce(manifest);

      webhookEntity.checkPassed = false;

      const result = await webhookService.processPaidWebhook(
        webhookEntity as WebhookIncomingEntity,
      );

      expect(decreaseReputationSpy).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(String),
        expect.any(String),
      );
      expect(result).toBe(true);
    });

    it('should process a paid webhook, update retries count and waitUntil date, and return false if an error occurs', async () => {
      const updateOneSpy = jest
        .spyOn(webhookRepository, 'updateOne')
        .mockResolvedValueOnce(undefined as any);
      
      (EscrowClient.build as any).mockImplementation(() => ({
        getResultsUrl: jest
          .fn()
          .mockRejectedValueOnce(new Error())
      }));

      const result = await webhookService.processPaidWebhook(
        webhookEntity as WebhookIncomingEntity,
      );

      expect(updateOneSpy).toHaveBeenCalledWith(
        { id: webhookEntity.id },
        {
          retriesCount: (webhookEntity.retriesCount as number) + 1,
          waitUntil: expect.any(Date),
        },
      );
      expect(result).toBe(false);
    });

    it('should process a paid webhook, update status to failed if retries count is over the threshold, and return false if an error occurs', async () => {
      webhookEntity.retriesCount = RETRIES_COUNT_THRESHOLD;
      const updateOneSpy = jest
        .spyOn(webhookRepository, 'updateOne')
        .mockResolvedValueOnce(undefined as any);
      
      (EscrowClient.build as any).mockImplementation(() => ({
        getResultsUrl: jest
          .fn()
          .mockRejectedValueOnce(new Error('Some error'))
      }));

      const result = await webhookService.processPaidWebhook(
        webhookEntity as WebhookIncomingEntity,
      );

      expect(updateOneSpy).toHaveBeenCalledWith(
        { id: webhookEntity.id },
        { status: WebhookStatus.FAILED },
      );
      expect(result).toBe(false);
    });

    it('should throw an error if no final results are found and return false', async () => {
      (EscrowClient.build as any).mockImplementation(() => ({
        getResultsUrl: jest
          .fn()
          .mockResolvedValueOnce(MOCK_FILE_URL)
      }));
      jest
        .spyOn(StorageClient, 'downloadFileFromUrl')
        .mockRejectedValueOnce(new Error());

      const result = await webhookService.processPaidWebhook(
        webhookEntity as WebhookIncomingEntity,
      );
      expect(result).toBe(false);
    });
  });
});
