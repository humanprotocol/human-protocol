import { createMock } from '@golevelup/ts-jest';
import { ChainId } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  MOCK_ADDRESS,
  MOCK_MAX_RETRY_COUNT,
  MOCK_PRIVATE_KEY,
  mockConfig,
} from '../../../test/constants';
import { EscrowCompletionTrackingStatus } from '../../common/enums/webhook';
import { Web3Service } from '../web3/web3.service';
import { EscrowCompletionTrackingRepository } from './escrow-completion-tracking.repository';
import { EscrowCompletionTrackingEntity } from './escrow-completion-tracking.entity';
import { ErrorEscrowCompletionTracking } from '../../common/constants/errors';
import { HttpStatus } from '@nestjs/common';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ServerConfigService } from '../../common/config/server-config.service';
import { ControlledError } from '../../common/errors/controlled';
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
      ).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should throw NotFoundException if escrow completion tracking not created', async () => {
      jest
        .spyOn(escrowCompletionTrackingRepository as any, 'createUnique')
        .mockResolvedValue(null);

      await expect(
        escrowCompletionTrackingService.createEscrowCompletionTracking(
          ChainId.LOCALHOST,
          MOCK_ADDRESS,
        ),
      ).rejects.toThrow(
        new ControlledError(
          ErrorEscrowCompletionTracking.NotCreated,
          HttpStatus.NOT_FOUND,
        ),
      );
    });
  });

  describe('handleEscrowCompletionTrackingError', () => {
    it('should set escrow completion tracking status to FAILED if retries exceed threshold', async () => {
      const webhookEntity: Partial<EscrowCompletionTrackingEntity> = {
        id: 1,
        status: EscrowCompletionTrackingStatus.PENDING,
        retriesCount: MOCK_MAX_RETRY_COUNT,
      };
      await (
        escrowCompletionTrackingService as any
      ).handleEscrowCompletionTrackingError(
        webhookEntity,
        new Error('Sample error'),
      );
      expect(escrowCompletionTrackingRepository.updateOne).toHaveBeenCalled();
      expect(webhookEntity.status).toBe(EscrowCompletionTrackingStatus.FAILED);
    });

    it('should increment retries count if below threshold', async () => {
      const webhookEntity: Partial<EscrowCompletionTrackingEntity> = {
        id: 1,
        status: EscrowCompletionTrackingStatus.PENDING,
        retriesCount: 0,
      };
      await (
        escrowCompletionTrackingService as any
      ).handleEscrowCompletionTrackingError(
        webhookEntity,
        new Error('Sample error'),
      );
      expect(escrowCompletionTrackingRepository.updateOne).toHaveBeenCalled();
      expect(webhookEntity.status).toBe(EscrowCompletionTrackingStatus.PENDING);
      expect(webhookEntity.retriesCount).toBe(1);
      expect(webhookEntity.waitUntil).toBeInstanceOf(Date);
    });
  });
});
