import { createMock } from '@golevelup/ts-jest';
import { ChainId, EscrowClient, EscrowStatus } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  MOCK_ADDRESS,
  MOCK_BACKOFF_INTERVAL_SECONDS,
  MOCK_MAX_RETRY_COUNT,
  MOCK_PRIVATE_KEY,
  MOCK_WEBHOOK_URL,
  mockConfig,
} from '../../../test/constants';
import { EscrowCompletionStatus } from '../../common/enums/webhook';
import { Web3Service } from '../web3/web3.service';
import { EscrowCompletionRepository } from './escrow-completion.repository';
import { EscrowCompletionEntity } from './escrow-completion.entity';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ServerConfigService } from '../../common/config/server-config.service';
import { EscrowCompletionService } from './escrow-completion.service';
import { PostgresErrorCodes } from '../../common/enums/database';
import { WebhookOutgoingService } from '../webhook/webhook-outgoing.service';
import { PayoutService } from '../payout/payout.service';
import { ReputationService } from '../reputation/reputation.service';
import { DatabaseError } from '../../common/errors/database';
import { ErrorEscrowCompletion } from '../../common/constants/errors';
import { WebhookOutgoingRepository } from '../webhook/webhook-outgoing.repository';
import { StorageService } from '../storage/storage.service';
import { ReputationRepository } from '../reputation/reputation.repository';
import { ReputationConfigService } from '../../common/config/reputation-config.service';
import { PGPConfigService } from '../../common/config/pgp-config.service';
import { S3ConfigService } from '../../common/config/s3-config.service';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowClient: {
    build: jest.fn().mockImplementation(() => ({
      getJobLauncherAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      getExchangeOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      getRecordingOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      complete: jest.fn().mockResolvedValue(null),
      getStatus: jest.fn(),
    })),
  },
  OperatorUtils: {
    getLeader: jest.fn().mockImplementation(() => {
      return { webhookUrl: MOCK_WEBHOOK_URL };
    }),
  },
}));

jest.mock('../../common/utils/backoff', () => ({
  ...jest.requireActual('../../common/utils/backoff'),
  calculateExponentialBackoffMs: jest
    .fn()
    .mockReturnValue(MOCK_BACKOFF_INTERVAL_SECONDS * 1000),
}));

describe('escrowCompletionService', () => {
  let escrowCompletionService: EscrowCompletionService,
    escrowCompletionRepository: EscrowCompletionRepository,
    web3ConfigService: Web3ConfigService,
    webhookOutgoingService: WebhookOutgoingService,
    reputationService: ReputationService;

  const signerMock = {
    address: MOCK_ADDRESS,
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => mockConfig[key]),
    getOrThrow: jest.fn((key: string) => {
      if (!mockConfig[key])
        throw new Error(`Configuration key "${key}" does not exist`);
      return mockConfig[key];
    }),
  };

  // Mock Web3Service
  const mockWeb3Service = {
    getSigner: jest.fn().mockReturnValue(signerMock),
    validateChainId: jest.fn().mockReturnValue(new Error()),
    calculateGasPrice: jest.fn().mockReturnValue(1000n),
    getOperatorAddress: jest.fn().mockReturnValue(MOCK_ADDRESS),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfig[key]),
            getOrThrow: jest.fn((key: string) => {
              if (!mockConfig[key]) {
                throw new Error(`Configuration key "${key}" does not exist`);
              }
              return mockConfig[key];
            }),
          },
        },
        EscrowCompletionService,
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
          },
        },
        {
          provide: EscrowCompletionRepository,
          useValue: createMock<EscrowCompletionRepository>(),
        },
        {
          provide: WebhookOutgoingRepository,
          useValue: createMock<WebhookOutgoingRepository>(),
        },
        {
          provide: ReputationRepository,
          useValue: createMock<ReputationRepository>(),
        },
        // Mocked services
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: Web3Service,
          useValue: mockWeb3Service,
        },
        WebhookOutgoingService,
        PayoutService,
        ReputationService,
        Web3ConfigService,
        ServerConfigService,
        StorageService,
        ReputationConfigService,
        S3ConfigService,
        PGPConfigService,
        { provide: HttpService, useValue: createMock<HttpService>() },
      ],
    }).compile();

    escrowCompletionService = moduleRef.get<EscrowCompletionService>(
      EscrowCompletionService,
    );

    webhookOutgoingService = moduleRef.get<WebhookOutgoingService>(
      WebhookOutgoingService,
    );
    reputationService = moduleRef.get<ReputationService>(ReputationService);
    escrowCompletionRepository = moduleRef.get(EscrowCompletionRepository);
    web3ConfigService = moduleRef.get(Web3ConfigService);

    jest
      .spyOn(web3ConfigService, 'privateKey', 'get')
      .mockReturnValue(MOCK_PRIVATE_KEY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createEscrowCompletion', () => {
    const escrowCompletionEntity: Partial<EscrowCompletionEntity> = {
      chainId: ChainId.LOCALHOST,
      escrowAddress: MOCK_ADDRESS,
      status: EscrowCompletionStatus.PENDING,
      waitUntil: new Date(),
      retriesCount: 0,
    };

    it('should successfully create escrow completion with valid DTO', async () => {
      jest
        .spyOn(escrowCompletionRepository, 'createUnique')
        .mockResolvedValue(escrowCompletionEntity as EscrowCompletionEntity);

      await escrowCompletionService.createEscrowCompletion(
        ChainId.LOCALHOST,
        MOCK_ADDRESS,
      );

      expect(escrowCompletionRepository.createUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          chainId: ChainId.LOCALHOST,
          escrowAddress: MOCK_ADDRESS,
          status: EscrowCompletionStatus.PENDING,
          retriesCount: 0,
          waitUntil: expect.any(Date),
        }),
      );
    });
  });

  describe('handleEscrowCompletionError', () => {
    it('should set escrow completion status to FAILED if retries exceed threshold', async () => {
      const escrowCompletionEntity: Partial<EscrowCompletionEntity> = {
        id: 1,
        status: EscrowCompletionStatus.PENDING,
        retriesCount: MOCK_MAX_RETRY_COUNT,
      };
      await (escrowCompletionService as any).handleEscrowCompletionError(
        escrowCompletionEntity,
        new Error('Sample error'),
      );
      expect(escrowCompletionRepository.updateOne).toHaveBeenCalled();
      expect(escrowCompletionEntity.status).toBe(EscrowCompletionStatus.FAILED);
    });

    it('should increment retries count if below threshold and set waitUntil to a future date', async () => {
      const escrowCompletionEntity: Partial<EscrowCompletionEntity> = {
        id: 1,
        status: EscrowCompletionStatus.PENDING,
        retriesCount: 0,
        waitUntil: new Date(),
      };
      await (escrowCompletionService as any).handleEscrowCompletionError(
        escrowCompletionEntity,
        new Error('Sample error'),
      );
      expect(escrowCompletionRepository.updateOne).toHaveBeenCalled();
      expect(escrowCompletionEntity.status).toBe(
        EscrowCompletionStatus.PENDING,
      );
      expect(escrowCompletionEntity.retriesCount).toBe(1);
      expect(escrowCompletionEntity.waitUntil).toBeInstanceOf(Date);

      const now = new Date();
      const waitUntil = escrowCompletionEntity.waitUntil as Date;
      expect(waitUntil).toBeInstanceOf(Date);
      expect(waitUntil.getTime()).toBeGreaterThan(now.getTime());
    });
  });

  describe('processPendingEscrowCompletion', () => {
    it('should save results and execute paypouts for all of the pending escrows completion', async () => {
      const mockEntity = {
        id: 1,
        status: EscrowCompletionStatus.PENDING,
      };
      jest
        .spyOn(escrowCompletionRepository, 'findByStatus')
        .mockResolvedValue([mockEntity as any]);

      const updateOneMock = jest
        .spyOn(escrowCompletionRepository, 'updateOne')
        .mockResolvedValue(mockEntity as any);

      await escrowCompletionService.processPendingEscrowCompletion();

      expect(updateOneMock).toHaveBeenCalled();
    });

    it('should handle errors and continue processing other entities', async () => {
      const mockEntity1 = {
        id: 1,
        status: EscrowCompletionStatus.PENDING,
      };
      const mockEntity2 = {
        id: 2,
        status: EscrowCompletionStatus.PENDING,
      };

      jest
        .spyOn(escrowCompletionRepository, 'findByStatus')
        .mockResolvedValue([mockEntity1 as any, mockEntity2 as any]);

      jest
        .spyOn(escrowCompletionRepository, 'updateOne')
        .mockImplementationOnce(() => {
          throw new Error('Test error');
        }) // Fails for mockEntity1
        .mockResolvedValue(mockEntity2 as any); // Succeeds for mockEntity2

      const handleErrorMock = jest.spyOn(
        escrowCompletionService as any,
        'handleEscrowCompletionError',
      );

      await escrowCompletionService.processPendingEscrowCompletion();

      expect(handleErrorMock).toHaveBeenCalledWith(
        mockEntity1,
        expect.stringContaining(ErrorEscrowCompletion.PendingProcessingFailed),
      );

      // Ensure the second entity is processed successfully
      expect(escrowCompletionRepository.updateOne).toHaveBeenCalledWith(
        mockEntity2,
      );
    });
  });

  describe('processPaidEscrowCompletion', () => {
    let assessReputationScoresMock: jest.SpyInstance;
    let createOutgoingWebhookMock: jest.SpyInstance;

    beforeEach(() => {
      assessReputationScoresMock = jest
        .spyOn(reputationService, 'assessReputationScores')
        .mockResolvedValue();

      createOutgoingWebhookMock = jest
        .spyOn(webhookOutgoingService, 'createOutgoingWebhook')
        .mockResolvedValue();

      EscrowClient.build = jest.fn().mockResolvedValue({
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Paid),
        complete: jest.fn().mockResolvedValue(true),
        getJobLauncherAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
        getExchangeOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
        getRecordingOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      });
    });

    it('should assess reputation scores and create outgoing webhook for all of the paid escrows completion', async () => {
      const mockEntity = { id: 1, status: EscrowCompletionStatus.PAID };

      jest
        .spyOn(escrowCompletionRepository, 'findByStatus')
        .mockResolvedValue([mockEntity as any]);

      const updateOneMock = jest
        .spyOn(escrowCompletionRepository, 'updateOne')
        .mockResolvedValue(mockEntity as any);

      await escrowCompletionService.processPaidEscrowCompletion();

      expect(updateOneMock).toHaveBeenCalledWith({
        id: mockEntity.id,
        status: EscrowCompletionStatus.COMPLETED,
      });
      expect(assessReputationScoresMock).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during entity processing without skipping remaining entities', async () => {
      const mockEntity1 = {
        id: 1,
        status: EscrowCompletionStatus.PAID,
      };
      const mockEntity2 = {
        id: 2,
        status: EscrowCompletionStatus.PAID,
      };

      jest
        .spyOn(escrowCompletionRepository, 'findByStatus')
        .mockResolvedValue([mockEntity1 as any, mockEntity2 as any]);

      const updateOneMock = jest
        .spyOn(escrowCompletionRepository, 'updateOne')
        .mockImplementationOnce(() => {
          throw new Error('Test error');
        })
        .mockResolvedValueOnce(mockEntity2 as any);

      await escrowCompletionService.processPaidEscrowCompletion();

      expect(updateOneMock).toHaveBeenCalledTimes(3);
      expect(assessReputationScoresMock).toHaveBeenCalledTimes(2);
    });

    it('should handle duplicate errors when creating outgoing webhooks and not update entity status', async () => {
      const mockEntity = { id: 1, status: EscrowCompletionStatus.PAID };

      jest
        .spyOn(escrowCompletionRepository, 'findByStatus')
        .mockResolvedValue([mockEntity as any]);

      const updateOneMock = jest
        .spyOn(escrowCompletionRepository, 'updateOne')
        .mockResolvedValue(mockEntity as any);

      createOutgoingWebhookMock = jest
        .spyOn(webhookOutgoingService, 'createOutgoingWebhook')
        .mockImplementation(() => {
          throw new DatabaseError(
            'Duplicate entry error',
            PostgresErrorCodes.Duplicated,
          );
        });

      await escrowCompletionService.processPaidEscrowCompletion();

      expect(createOutgoingWebhookMock).toHaveBeenCalled();
      expect(updateOneMock).not.toHaveBeenCalledWith({
        id: mockEntity.id,
        status: EscrowCompletionStatus.COMPLETED,
      });
    });
  });
});
