import { Test } from '@nestjs/testing';
import { WebhookService } from './webhook.service';
import { WebhookRepository } from './webhook.repository';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { createMock } from '@golevelup/ts-jest';
import { ReputationService } from '../reputation/reputation.service';
import { FinalResult, ManifestDto, WebhookIncomingDto } from './webhook.dto';
import {
  ChainId,
  EscrowClient,
  InitClient,
  NETWORKS,
  NetworkData,
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
import { JobMode, JobRequestType } from '../../common/enums/job';
import {
  MOCK_ADDRESS,
  MOCK_FILE_HASH,
  MOCK_FILE_KEY,
  MOCK_FILE_URL,
  MOCK_JOB_LAUNCHER_FEE,
  MOCK_RECORDING_ORACLE_FEE,
  MOCK_REPUTATION_ORACLE_FEE,
  MOCK_REQUESTER_DESCRIPTION,
  MOCK_REQUESTER_TITLE,
} from '../../common/test/constants';
import { WebhookStatus } from '../../common/decorators';
import { RETRIES_COUNT_THRESHOLD } from '../../common/constants';
import { Web3Service } from '../web3/web3.service';

jest.mock('@human-protocol/sdk');

describe('WebhookService', () => {
  let webhookService: WebhookService,
    reputationService: ReputationService,
    webhookRepository: WebhookRepository,
    mockSigner: any;

  const signerMock = {
    address: MOCK_ADDRESS,
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  beforeEach(async () => {
    const mockConfigService: Partial<ConfigService> = {
      get: jest.fn((key: string, defaultValue?: any) => {
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
            return '5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';
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

    const provider = new ethers.providers.JsonRpcProvider();
    mockSigner = {
      ...provider.getSigner(),
      getAddress: jest.fn().mockReturnValue(ethers.constants.AddressZero),
    };

    const chainId: ChainId = 80001;
    const networkData = NETWORKS[chainId];

    const getClientParamsMock = InitClient.getParams as jest.Mock;
    getClientParamsMock.mockResolvedValue({
      signerOrProvider: mockSigner,
      network: networkData as NetworkData,
    });
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

  describe('processPendingWebhook', () => {
    const webhookEntity: Partial<WebhookIncomingEntity> = {
      id: 1,
      chainId: ChainId.LOCALHOST,
      escrowAddress: MOCK_ADDRESS,
      status: WebhookStatus.PENDING,
      waitUntil: new Date(),
    };

    const intermediateResults: FinalResult[] = [
      {
        exchangeAddress: 'string',
        workerAddress: 'string',
        solution: 'string',
      },
    ];

    it('should process a pending webhook and return true', async () => {
      const manifestUrl = MOCK_FILE_URL;

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

      const manifest: ManifestDto = {
        requestType: JobRequestType.FORTUNE,
        submissionsRequired: 10,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fee: totalFee.toString(),
        fundAmount: totalAmount.toString(),
        mode: JobMode.DESCRIPTIVE,
      };

      const uploadFilesSpy = jest
        .spyOn(StorageClient.prototype, 'uploadFiles')
        .mockResolvedValueOnce([
          { key: MOCK_FILE_KEY, url: MOCK_FILE_URL, hash: MOCK_FILE_HASH },
        ]);

      const storeResultsSpy = jest
        .spyOn(EscrowClient.prototype, 'storeResults')
        .mockResolvedValueOnce(undefined);

      const updateOneSpy = jest
        .spyOn(webhookRepository, 'updateOne')
        .mockResolvedValueOnce(webhookEntity as WebhookIncomingEntity);

      const bulkPayOutSpy = jest
        .spyOn(EscrowClient.prototype, 'bulkPayOut')
        .mockResolvedValueOnce(undefined);

      jest
        .spyOn(EscrowClient.prototype, 'getManifestUrl')
        .mockResolvedValueOnce(manifestUrl);
      jest
        .spyOn(StorageClient, 'downloadFileFromUrl')
        .mockResolvedValueOnce(manifest);
      jest
        .spyOn(webhookService, 'getIntermediateResults')
        .mockResolvedValueOnce(intermediateResults);
      jest
        .spyOn(webhookService, 'finalizeFortuneResults')
        .mockResolvedValueOnce(intermediateResults);

      const result = await webhookService.processPendingWebhook(
        webhookEntity as WebhookIncomingEntity,
      );

      expect(webhookService.getIntermediateResults).toHaveBeenCalledWith(
        webhookEntity.chainId,
        webhookEntity.escrowAddress,
      );
      expect(webhookService.finalizeFortuneResults).toHaveBeenCalledWith(
        intermediateResults,
      );
      expect(uploadFilesSpy).toHaveBeenCalledWith(
        [intermediateResults],
        webhookService.bucket,
      );
      expect(storeResultsSpy).toHaveBeenCalledWith(
        webhookEntity.escrowAddress,
        MOCK_FILE_URL,
        MOCK_FILE_HASH,
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
      expect(bulkPayOutSpy).toHaveBeenCalledWith(
        webhookEntity.escrowAddress,
        expect.any(Array),
        expect.any(Array),
        MOCK_FILE_URL,
        MOCK_FILE_HASH,
      );
      expect(result).toBe(true);
    });

    it('should process a pending webhook, update status to FAILED, and return false if retries count exceeds threshold', async () => {
      webhookEntity.retriesCount = RETRIES_COUNT_THRESHOLD;

      const updateOneMock = jest
        .spyOn(webhookRepository, 'updateOne')
        .mockResolvedValueOnce(undefined as any);

      jest
        .spyOn(EscrowClient.prototype, 'getManifestUrl')
        .mockRejectedValueOnce(new Error());
      jest
        .spyOn(webhookService, 'getIntermediateResults')
        .mockResolvedValueOnce(intermediateResults);

      const result = await webhookService.processPendingWebhook(
        webhookEntity as WebhookIncomingEntity,
      );

      expect(EscrowClient.prototype.getManifestUrl).toHaveBeenCalledWith(
        webhookEntity.escrowAddress,
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

      jest
        .spyOn(EscrowClient.prototype, 'getManifestUrl')
        .mockRejectedValueOnce(
          new Error(ErrorManifest.ManifestUrlDoesNotExist),
        );

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
      jest
        .spyOn(EscrowClient.prototype, 'getManifestUrl')
        .mockResolvedValueOnce(MOCK_FILE_URL);
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

  describe('processPaidWebhook', () => {
    const webhookEntity: Partial<WebhookIncomingEntity> = {
      id: 1,
      chainId: ChainId.LOCALHOST,
      escrowAddress: MOCK_ADDRESS,
      status: WebhookStatus.PAID,
      retriesCount: 0,
    };

    it('should process a paid webhook and return true', async () => {
      const finalResultsUrl = MOCK_FILE_URL;
      const finalResults: FinalResult[] = [
        {
          exchangeAddress: 'string',
          workerAddress: 'string',
          solution: 'string',
        },
      ];

      const increaseReputationSpy = jest
        .spyOn(reputationService, 'increaseReputation')
        .mockResolvedValueOnce(undefined);
      const updateOneSpy = jest
        .spyOn(webhookRepository, 'updateOne')
        .mockResolvedValueOnce(undefined as any);

      jest
        .spyOn(EscrowClient.prototype, 'getResultsUrl')
        .mockResolvedValueOnce(finalResultsUrl);
      jest
        .spyOn(StorageClient, 'downloadFileFromUrl')
        .mockResolvedValueOnce(finalResults);
      jest
        .spyOn(EscrowClient.prototype, 'getRecordingOracleAddress')
        .mockResolvedValueOnce('recording-oracle-address');

      const result = await webhookService.processPaidWebhook(
        webhookEntity as WebhookIncomingEntity,
      );

      expect(EscrowClient.prototype.getResultsUrl).toHaveBeenCalledWith(
        webhookEntity.escrowAddress,
      );
      expect(StorageClient.downloadFileFromUrl).toHaveBeenCalledWith(
        finalResultsUrl,
      );
      expect(increaseReputationSpy).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(String),
        expect.any(String),
      );
      expect(
        EscrowClient.prototype.getRecordingOracleAddress,
      ).toHaveBeenCalledWith(webhookEntity.escrowAddress);
      expect(updateOneSpy).toHaveBeenCalledWith(
        { id: webhookEntity.id },
        { status: WebhookStatus.COMPLETED },
      );
      expect(result).toBe(true);
    });

    it('should process a paid webhook, decrease reputation, and return true if checkPassed is false', async () => {
      const finalResultsUrl = MOCK_FILE_URL;
      const finalResults: FinalResult[] = [
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

      jest
        .spyOn(EscrowClient.prototype, 'getResultsUrl')
        .mockResolvedValueOnce(finalResultsUrl);
      jest
        .spyOn(StorageClient, 'downloadFileFromUrl')
        .mockResolvedValueOnce(finalResults);
      jest
        .spyOn(EscrowClient.prototype, 'getRecordingOracleAddress')
        .mockResolvedValueOnce('recording-oracle-address');

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

      jest
        .spyOn(EscrowClient.prototype, 'getResultsUrl')
        .mockRejectedValueOnce(new Error());

      const result = await webhookService.processPaidWebhook(
        webhookEntity as WebhookIncomingEntity,
      );

      expect(EscrowClient.prototype.getResultsUrl).toHaveBeenCalledWith(
        webhookEntity.escrowAddress,
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

      jest
        .spyOn(EscrowClient.prototype, 'getResultsUrl')
        .mockRejectedValueOnce(new Error('Some error'));

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
      jest
        .spyOn(EscrowClient.prototype, 'getResultsUrl')
        .mockResolvedValueOnce(MOCK_FILE_URL);
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
