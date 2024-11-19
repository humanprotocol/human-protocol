import { createMock } from '@golevelup/ts-jest';
import { ChainId } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  MOCK_ADDRESS,
  MOCK_BACKOFF_INTERVAL_SECONDS,
  MOCK_MAX_RETRY_COUNT,
  MOCK_PRIVATE_KEY,
  mockConfig,
} from '../../../test/constants';
import { EscrowCompletionTrackingStatus } from '../../common/enums/webhook';
import { Web3Service } from '../web3/web3.service';
import { EscrowCompletionTrackingRepository } from './escrow-completion-tracking.repository';
import { EscrowCompletionTrackingEntity } from './escrow-completion-tracking.entity';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ServerConfigService } from '../../common/config/server-config.service';
import { EscrowCompletionTrackingService } from './escrow-completion-tracking.service';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowClient: {
    build: jest.fn(),
  },
  KVStoreClient: {
    build: jest.fn(),
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
    web3ConfigService: Web3ConfigService;

  const signerMock = {
    address: MOCK_ADDRESS,
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
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
        Web3ConfigService,
        ServerConfigService,
        { provide: HttpService, useValue: createMock<HttpService>() },
      ],
    }).compile();

    escrowCompletionTrackingService =
      moduleRef.get<EscrowCompletionTrackingService>(
        EscrowCompletionTrackingService,
      );
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

    it('should increment retries count if below threshold', async () => {
      const escrowCompletionTrackingEntity: Partial<EscrowCompletionTrackingEntity> =
        {
          id: 1,
          status: EscrowCompletionTrackingStatus.PENDING,
          retriesCount: 0,
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
    });

    it('should set waitUntil to a future date when incrementing retries count', async () => {
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

      const now = new Date();
      const waitUntil = escrowCompletionTrackingEntity.waitUntil as Date;

      expect(waitUntil).toBeInstanceOf(Date);
      expect(waitUntil.getTime()).toBeGreaterThan(now.getTime());
    });
  });
});
