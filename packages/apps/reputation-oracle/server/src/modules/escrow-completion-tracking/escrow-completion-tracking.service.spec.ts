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
import { EscrowCompletionTrackingStatus } from '../../common/enums/webhook';
import { Web3Service } from '../web3/web3.service';
import { EscrowCompletionTrackingRepository } from './escrow-completion-tracking.repository';
import { EscrowCompletionTrackingEntity } from './escrow-completion-tracking.entity';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ServerConfigService } from '../../common/config/server-config.service';
import { EscrowCompletionTrackingService } from './escrow-completion-tracking.service';
import { PostgresErrorCodes } from '../../common/enums/database';
import { WebhookOutgoingService } from '../webhook/webhook-outgoing.service';
import { PayoutService } from '../payout/payout.service';
import { ReputationService } from '../reputation/reputation.service';
import { DatabaseError } from '../../common/errors/database';
import { ErrorEscrowCompletionTracking } from '../../common/constants/errors';
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

describe('escrowCompletionTrackingService', () => {
  let escrowCompletionTrackingService: EscrowCompletionTrackingService,
    escrowCompletionTrackingRepository: EscrowCompletionTrackingRepository,
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
        EscrowCompletionTrackingService,
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
          },
        },
        {
          provide: EscrowCompletionTrackingRepository,
          useValue: createMock<EscrowCompletionTrackingRepository>(),
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

    escrowCompletionTrackingService =
      moduleRef.get<EscrowCompletionTrackingService>(
        EscrowCompletionTrackingService,
      );

    webhookOutgoingService = moduleRef.get<WebhookOutgoingService>(
      WebhookOutgoingService,
    );
    reputationService = moduleRef.get<ReputationService>(ReputationService);
    escrowCompletionTrackingRepository = moduleRef.get(
      EscrowCompletionTrackingRepository,
    );
    web3ConfigService = moduleRef.get(Web3ConfigService);

    jest
      .spyOn(web3ConfigService, 'privateKey', 'get')
      .mockReturnValue(MOCK_PRIVATE_KEY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createEscrowCompletionTracking', () => {
    const escrowCompletionTrackingEntity: Partial<EscrowCompletionTrackingEntity> =
      {
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        status: EscrowCompletionTrackingStatus.PENDING,
        waitUntil: new Date(),
        retriesCount: 0,
      };

    it('should successfully create escrow completion tracking with valid DTO', async () => {
      jest
        .spyOn(escrowCompletionTrackingRepository, 'createUnique')
        .mockResolvedValue(
          escrowCompletionTrackingEntity as EscrowCompletionTrackingEntity,
        );

      await escrowCompletionTrackingService.createEscrowCompletionTracking(
        ChainId.LOCALHOST,
        MOCK_ADDRESS,
      );

      expect(
        escrowCompletionTrackingRepository.createUnique,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          chainId: ChainId.LOCALHOST,
          escrowAddress: MOCK_ADDRESS,
          status: EscrowCompletionTrackingStatus.PENDING,
          retriesCount: 0,
          waitUntil: expect.any(Date),
        }),
      );
    });
  });

  describe('handleEscrowCompletionTrackingError', () => {
    it('should set escrow completion tracking status to FAILED if retries exceed threshold', async () => {
      const escrowCompletionTrackingEntity: Partial<EscrowCompletionTrackingEntity> =
        {
          id: 1,
          status: EscrowCompletionTrackingStatus.PENDING,
          retriesCount: MOCK_MAX_RETRY_COUNT,
        };
      await (
        escrowCompletionTrackingService as any
      ).handleEscrowCompletionTrackingError(
        escrowCompletionTrackingEntity,
        new Error('Sample error'),
      );
      expect(escrowCompletionTrackingRepository.updateOne).toHaveBeenCalled();
      expect(escrowCompletionTrackingEntity.status).toBe(
        EscrowCompletionTrackingStatus.FAILED,
      );
    });

    it('should increment retries count if below threshold and set waitUntil to a future date', async () => {
      const escrowCompletionTrackingEntity: Partial<EscrowCompletionTrackingEntity> =
        {
          id: 1,
          status: EscrowCompletionTrackingStatus.PENDING,
          retriesCount: 0,
          waitUntil: new Date(),
        };
      await (
        escrowCompletionTrackingService as any
      ).handleEscrowCompletionTrackingError(
        escrowCompletionTrackingEntity,
        new Error('Sample error'),
      );
      expect(escrowCompletionTrackingRepository.updateOne).toHaveBeenCalled();
      expect(escrowCompletionTrackingEntity.status).toBe(
        EscrowCompletionTrackingStatus.PENDING,
      );
      expect(escrowCompletionTrackingEntity.retriesCount).toBe(1);
      expect(escrowCompletionTrackingEntity.waitUntil).toBeInstanceOf(Date);

      const now = new Date();
      const waitUntil = escrowCompletionTrackingEntity.waitUntil as Date;
      expect(waitUntil).toBeInstanceOf(Date);
      expect(waitUntil.getTime()).toBeGreaterThan(now.getTime());
    });
  });

  describe('processPendingEscrowCompletion', () => {
    it('should save results and execute paypouts for all of the pending escrows completion', async () => {
      const mockEntity = {
        id: 1,
        status: EscrowCompletionTrackingStatus.PENDING,
      };
      jest
        .spyOn(escrowCompletionTrackingRepository, 'findByStatus')
        .mockResolvedValue([mockEntity as any]);

      const updateOneMock = jest
        .spyOn(escrowCompletionTrackingRepository, 'updateOne')
        .mockResolvedValue(mockEntity as any);

      await escrowCompletionTrackingService.processPendingEscrowCompletion();

      expect(updateOneMock).toHaveBeenCalled();
    });

    it('should handle errors and continue processing other entities', async () => {
      const mockEntity1 = {
        id: 1,
        status: EscrowCompletionTrackingStatus.PENDING,
      };
      const mockEntity2 = {
        id: 2,
        status: EscrowCompletionTrackingStatus.PENDING,
      };

      jest
        .spyOn(escrowCompletionTrackingRepository, 'findByStatus')
        .mockResolvedValue([mockEntity1 as any, mockEntity2 as any]);

      jest
        .spyOn(escrowCompletionTrackingRepository, 'updateOne')
        .mockImplementationOnce(() => {
          throw new Error('Test error');
        }) // Fails for mockEntity1
        .mockResolvedValue(mockEntity2 as any); // Succeeds for mockEntity2

      const handleErrorMock = jest.spyOn(
        escrowCompletionTrackingService,
        'handleEscrowCompletionTrackingError',
      );

      await escrowCompletionTrackingService.processPendingEscrowCompletion();

      expect(handleErrorMock).toHaveBeenCalledWith(
        mockEntity1,
        expect.stringContaining(
          ErrorEscrowCompletionTracking.PendingProcessingFailed,
        ),
      );

      // Ensure the second entity is processed successfully
      expect(escrowCompletionTrackingRepository.updateOne).toHaveBeenCalledWith(
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
      const mockEntity = { id: 1, status: EscrowCompletionTrackingStatus.PAID };

      jest
        .spyOn(escrowCompletionTrackingRepository, 'findByStatus')
        .mockResolvedValue([mockEntity as any]);

      const updateOneMock = jest
        .spyOn(escrowCompletionTrackingRepository, 'updateOne')
        .mockResolvedValue(mockEntity as any);

      await escrowCompletionTrackingService.processPaidEscrowCompletion();

      expect(updateOneMock).toHaveBeenCalledWith({
        id: mockEntity.id,
        status: EscrowCompletionTrackingStatus.COMPLETED,
      });
      expect(assessReputationScoresMock).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during entity processing without skipping remaining entities', async () => {
      const mockEntity1 = {
        id: 1,
        status: EscrowCompletionTrackingStatus.PAID,
      };
      const mockEntity2 = {
        id: 2,
        status: EscrowCompletionTrackingStatus.PAID,
      };

      jest
        .spyOn(escrowCompletionTrackingRepository, 'findByStatus')
        .mockResolvedValue([mockEntity1 as any, mockEntity2 as any]);

      const updateOneMock = jest
        .spyOn(escrowCompletionTrackingRepository, 'updateOne')
        .mockImplementationOnce(() => {
          throw new Error('Test error');
        })
        .mockResolvedValueOnce(mockEntity2 as any);

      await escrowCompletionTrackingService.processPaidEscrowCompletion();

      expect(updateOneMock).toHaveBeenCalledTimes(3);
      expect(assessReputationScoresMock).toHaveBeenCalledTimes(2);
    });

    it('should handle duplicate errors when creating outgoing webhooks and not update entity status', async () => {
      const mockEntity = { id: 1, status: EscrowCompletionTrackingStatus.PAID };

      jest
        .spyOn(escrowCompletionTrackingRepository, 'findByStatus')
        .mockResolvedValue([mockEntity as any]);

      const updateOneMock = jest
        .spyOn(escrowCompletionTrackingRepository, 'updateOne')
        .mockResolvedValue(mockEntity as any);

      createOutgoingWebhookMock = jest
        .spyOn(webhookOutgoingService, 'createOutgoingWebhook')
        .mockImplementation(() => {
          throw new DatabaseError(
            'Duplicate entry error',
            PostgresErrorCodes.Duplicated,
          );
        });

      await escrowCompletionTrackingService.processPaidEscrowCompletion();

      expect(createOutgoingWebhookMock).toHaveBeenCalled();
      expect(updateOneMock).not.toHaveBeenCalledWith({
        id: mockEntity.id,
        status: EscrowCompletionTrackingStatus.COMPLETED,
      });
    });
  });
});
