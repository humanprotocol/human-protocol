import { createMock } from '@golevelup/ts-jest';
import { ChainId, EscrowClient, EscrowStatus } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  MOCK_ADDRESS,
  MOCK_BACKOFF_INTERVAL_SECONDS,
  MOCK_FILE_HASH,
  MOCK_FILE_URL,
  MOCK_MAX_RETRY_COUNT,
  MOCK_PRIVATE_KEY,
  MOCK_REPUTATION_ORACLE_ADDRESS,
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
import { WebhookOutgoingRepository } from '../webhook/webhook-outgoing.repository';
import { StorageService } from '../storage/storage.service';
import { ReputationRepository } from '../reputation/reputation.repository';
import { ReputationConfigService } from '../../common/config/reputation-config.service';
import { PGPConfigService } from '../../common/config/pgp-config.service';
import { S3ConfigService } from '../../common/config/s3-config.service';
import { EscrowPayoutsBatchRepository } from './escrow-payouts-batch.repository';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  OperatorUtils: {
    getLeader: jest.fn().mockImplementation(() => {
      return { webhookUrl: MOCK_WEBHOOK_URL };
    }),
  },
  TransactionUtils: {
    getTransaction: jest.fn(),
  },
}));

jest.mock('../../common/utils/backoff', () => ({
  ...jest.requireActual('../../common/utils/backoff'),
  calculateExponentialBackoffMs: jest
    .fn()
    .mockReturnValue(MOCK_BACKOFF_INTERVAL_SECONDS * 1000),
}));

const ESCROW_CLIENT_MOCK = {
  getJobLauncherAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
  getExchangeOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
  getRecordingOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
  complete: jest.fn().mockResolvedValue(null),
  getStatus: jest.fn().mockResolvedValue(EscrowStatus.Launched),
  createBulkPayoutTransaction: jest.fn(),
};

EscrowClient.build = jest.fn().mockResolvedValue(ESCROW_CLIENT_MOCK);

const MOCK_ADDRESS_PAYOUT = {
  address: MOCK_ADDRESS,
  amount: BigInt(42),
};
const mockPayouts = [
  MOCK_ADDRESS_PAYOUT,
  ...Array.from({ length: 99 }, (_value, index) => {
    const _index = index + 1;
    return {
      address: `0x${_index}`.padEnd(42, '0'),
      amount: BigInt(_index),
    };
  }),
];

describe('escrowCompletionService', () => {
  let escrowCompletionService: EscrowCompletionService,
    escrowCompletionRepository: EscrowCompletionRepository,
    escrowPayoutsBatchRepository: EscrowPayoutsBatchRepository,
    web3ConfigService: Web3ConfigService,
    webhookOutgoingService: WebhookOutgoingService,
    reputationService: ReputationService,
    payoutService: PayoutService;

  const signerMock = {
    address: MOCK_ADDRESS,
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
    sendTransaction: jest.fn().mockImplementation(() => ({
      wait: jest.fn(),
    })),
    signTransaction: jest.fn().mockResolvedValue('signed-tx'),
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
          provide: EscrowPayoutsBatchRepository,
          useValue: createMock<EscrowPayoutsBatchRepository>(),
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
    payoutService = moduleRef.get<PayoutService>(PayoutService);
    reputationService = moduleRef.get<ReputationService>(ReputationService);
    escrowCompletionRepository = moduleRef.get(EscrowCompletionRepository);
    escrowPayoutsBatchRepository = moduleRef.get(EscrowPayoutsBatchRepository);
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

  describe('processPendingEscrowCompletion', () => {
    let processResultsMock: any, calculatePayoutsMock: any;
    let escrowCompletionEntity1: Partial<EscrowCompletionEntity>,
      escrowCompletionEntity2: Partial<EscrowCompletionEntity>;

    beforeEach(() => {
      escrowCompletionEntity1 = {
        id: 1,
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        status: EscrowCompletionStatus.PENDING,
        waitUntil: new Date(),
        retriesCount: 0,
      };

      escrowCompletionEntity2 = {
        id: 2,
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        status: EscrowCompletionStatus.PENDING,
        waitUntil: new Date(),
        retriesCount: 0,
      };

      ESCROW_CLIENT_MOCK.getStatus.mockResolvedValue(EscrowStatus.Pending);

      jest
        .spyOn(escrowCompletionRepository, 'findByStatus')
        .mockResolvedValue([
          escrowCompletionEntity1 as any,
          escrowCompletionEntity2 as any,
        ]);

      processResultsMock = jest.spyOn(payoutService as any, 'processResults');
      processResultsMock.mockResolvedValue({
        url: MOCK_FILE_URL,
        hash: MOCK_FILE_HASH,
      });

      calculatePayoutsMock = jest.spyOn(
        payoutService as any,
        'calculatePayouts',
      );
      calculatePayoutsMock.mockResolvedValue(mockPayouts);
    });

    it('should save results and payouts batches for all of the pending escrows completion', async () => {
      jest
        .spyOn(escrowCompletionRepository, 'findByStatus')
        .mockResolvedValue([escrowCompletionEntity1 as any]);

      const updateOneEscrowCompletionMock = jest
        .spyOn(escrowCompletionRepository, 'updateOne')
        .mockResolvedValue(escrowCompletionEntity1 as any);

      const createPayoutsBatchMock = jest.spyOn(
        escrowPayoutsBatchRepository,
        'createUnique',
      );

      await escrowCompletionService.processPendingEscrowCompletion();

      expect(processResultsMock).toHaveBeenCalledTimes(1);
      expect(calculatePayoutsMock).toHaveBeenCalledTimes(1);

      expect(createPayoutsBatchMock).toHaveBeenCalledTimes(2);
      expect(createPayoutsBatchMock).toHaveBeenLastCalledWith({
        escrowCompletionTrackingId: escrowCompletionEntity1.id,
        payouts: [
          {
            ...MOCK_ADDRESS_PAYOUT,
            amount: MOCK_ADDRESS_PAYOUT.amount.toString(),
          },
        ],
        payoutsHash: 'fd316abc331a3eb6c858e9ec87578986f954b366',
      });

      expect(updateOneEscrowCompletionMock).toHaveBeenCalledTimes(2);
    });

    it('should handle errors and continue processing other entities', async () => {
      escrowCompletionEntity1.finalResultsUrl = MOCK_FILE_URL;
      escrowCompletionEntity2.finalResultsUrl = MOCK_FILE_URL;

      jest
        .spyOn(escrowCompletionRepository, 'findByStatus')
        .mockResolvedValue([
          escrowCompletionEntity1 as any,
          escrowCompletionEntity2 as any,
        ]);

      jest
        .spyOn(payoutService, 'calculatePayouts')
        .mockImplementationOnce(() => {
          throw new Error('Test error');
        }) // Fails for escrowCompletionEntity1
        .mockResolvedValue([]); // Succeeds for escrowCompletionEntity2

      await escrowCompletionService.processPendingEscrowCompletion();

      // Verify that the first entity's error is handled, with retriesCount incremented to 1
      expect(escrowCompletionRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: escrowCompletionEntity1.id,
          status: EscrowCompletionStatus.PENDING,
          retriesCount: 1, // Retries count should be 1 after the error
        }),
      );
      // Verify that the second entity is successfully processed and its status is updated to 'PAID'
      expect(escrowCompletionRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: escrowCompletionEntity2.id,
          status: EscrowCompletionStatus.AWAITING_PAYOUTS,
          retriesCount: 0,
        }),
      );
    });

    it('should mark the escrow completion as FAILED if retries exceed the threshold', async () => {
      jest
        .spyOn(escrowCompletionRepository, 'findByStatus')
        .mockResolvedValue([escrowCompletionEntity1 as any]);

      const error = new Error('Processing error');
      const loggerErrorSpy = jest.spyOn(
        escrowCompletionService['logger'],
        'error',
      );

      escrowCompletionEntity1.retriesCount = MOCK_MAX_RETRY_COUNT;
      processResultsMock.mockRejectedValueOnce(error);

      await escrowCompletionService.processPendingEscrowCompletion();

      expect(escrowCompletionRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          status: EscrowCompletionStatus.FAILED,
          retriesCount: MOCK_MAX_RETRY_COUNT,
        }),
      );
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Error message: ${error.message}`),
      );
    });

    it('should skip processResults when finalResultsUrl is not empty', async () => {
      escrowCompletionEntity1.finalResultsUrl = MOCK_FILE_URL;

      jest
        .spyOn(escrowCompletionRepository, 'findByStatus')
        .mockResolvedValue([escrowCompletionEntity1 as any]);

      const updateOneMock = jest
        .spyOn(escrowCompletionRepository, 'updateOne')
        .mockResolvedValue(escrowCompletionEntity1 as any);

      await escrowCompletionService.processPendingEscrowCompletion();

      expect(updateOneMock).toHaveBeenCalledTimes(1);
      expect(processResultsMock).toHaveBeenCalledTimes(0);
      expect(calculatePayoutsMock).toHaveBeenCalledTimes(1);
    });

    it('should skip calculatePayouts when escrowStatus is not pending', async () => {
      ESCROW_CLIENT_MOCK.getStatus.mockResolvedValue(EscrowStatus.Launched);

      jest
        .spyOn(escrowCompletionRepository, 'findByStatus')
        .mockResolvedValue([escrowCompletionEntity1 as any]);

      const updateOneMock = jest
        .spyOn(escrowCompletionRepository, 'updateOne')
        .mockResolvedValue(escrowCompletionEntity1 as any);

      await escrowCompletionService.processPendingEscrowCompletion();

      expect(updateOneMock).toHaveBeenCalledTimes(1);
      expect(processResultsMock).toHaveBeenCalledTimes(0);
      expect(calculatePayoutsMock).toHaveBeenCalledTimes(0);
    });
  });

  describe('processPaidEscrowCompletion', () => {
    let assessReputationScoresMock: jest.SpyInstance,
      createOutgoingWebhookMock: jest.SpyInstance;
    let escrowCompletionEntity1: Partial<EscrowCompletionEntity>,
      escrowCompletionEntity2: Partial<EscrowCompletionEntity>;

    beforeEach(() => {
      ESCROW_CLIENT_MOCK.getStatus.mockResolvedValue(EscrowStatus.Partial);
      escrowCompletionEntity1 = {
        id: 1,
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        finalResultsUrl: MOCK_FILE_URL,
        finalResultsHash: MOCK_FILE_HASH,
        status: EscrowCompletionStatus.PAID,
        waitUntil: new Date(),
        retriesCount: 0,
      };

      escrowCompletionEntity2 = {
        id: 2,
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        finalResultsUrl: MOCK_FILE_URL,
        finalResultsHash: MOCK_FILE_HASH,
        status: EscrowCompletionStatus.PAID,
        waitUntil: new Date(),
        retriesCount: 0,
      };

      assessReputationScoresMock = jest
        .spyOn(reputationService, 'assessReputationScores')
        .mockResolvedValue();

      createOutgoingWebhookMock = jest
        .spyOn(webhookOutgoingService, 'createOutgoingWebhook')
        .mockResolvedValue();
    });

    it('should assess reputation scores and create outgoing webhook for all of the partially paid escrows completion', async () => {
      ESCROW_CLIENT_MOCK.getStatus.mockResolvedValueOnce(EscrowStatus.Partial);

      jest
        .spyOn(escrowCompletionRepository, 'findByStatus')
        .mockResolvedValue([escrowCompletionEntity1 as any]);

      const updateOneMock = jest
        .spyOn(escrowCompletionRepository, 'updateOne')
        .mockResolvedValue(escrowCompletionEntity1 as any);

      await escrowCompletionService.processPaidEscrowCompletion();

      expect(updateOneMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: escrowCompletionEntity1.id,
          status: EscrowCompletionStatus.COMPLETED,
        }),
      );
      expect(assessReputationScoresMock).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during entity processing without skipping remaining entities', async () => {
      jest
        .spyOn(escrowCompletionRepository, 'findByStatus')
        .mockResolvedValue([
          escrowCompletionEntity1 as any,
          escrowCompletionEntity2 as any,
        ]);

      const updateOneMock = jest
        .spyOn(escrowCompletionRepository, 'updateOne')
        .mockImplementationOnce(() => {
          throw new Error('Test error');
        })
        .mockResolvedValueOnce(escrowCompletionEntity2 as any);

      await escrowCompletionService.processPaidEscrowCompletion();

      expect(updateOneMock).toHaveBeenCalledTimes(3);
      expect(assessReputationScoresMock).toHaveBeenCalledTimes(2);
    });

    it('should mark the escrow completion as FAILED if retries exceed the threshold', async () => {
      jest
        .spyOn(escrowCompletionRepository, 'findByStatus')
        .mockResolvedValue([escrowCompletionEntity1 as any]);

      const error = new Error('Processing error');
      const loggerErrorSpy = jest.spyOn(
        escrowCompletionService['logger'],
        'error',
      );

      escrowCompletionEntity1.retriesCount = MOCK_MAX_RETRY_COUNT;
      assessReputationScoresMock.mockRejectedValueOnce(error);

      await escrowCompletionService.processPaidEscrowCompletion();

      expect(escrowCompletionRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          status: EscrowCompletionStatus.FAILED,
          retriesCount: MOCK_MAX_RETRY_COUNT,
        }),
      );
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Error message: ${error.message}`),
      );
    });

    it('should handle duplicate errors when creating outgoing webhooks and not update entity status', async () => {
      jest
        .spyOn(escrowCompletionRepository, 'findByStatus')
        .mockResolvedValue([escrowCompletionEntity1 as any]);

      const updateOneMock = jest
        .spyOn(escrowCompletionRepository, 'updateOne')
        .mockResolvedValue(escrowCompletionEntity1 as any);

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
        id: escrowCompletionEntity1.id,
        status: EscrowCompletionStatus.COMPLETED,
      });
    });

    it('should skip assessReputationScores when escrowStatus is not paid', async () => {
      ESCROW_CLIENT_MOCK.getStatus.mockResolvedValue(EscrowStatus.Launched);

      jest
        .spyOn(escrowCompletionRepository, 'findByStatus')
        .mockResolvedValue([escrowCompletionEntity1 as any]);

      const updateOneMock = jest
        .spyOn(escrowCompletionRepository, 'updateOne')
        .mockResolvedValue(escrowCompletionEntity1 as any);

      await escrowCompletionService.processPaidEscrowCompletion();

      expect(updateOneMock).toHaveBeenCalledTimes(1);
      expect(assessReputationScoresMock).toHaveBeenCalledTimes(0);
      expect(createOutgoingWebhookMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('processAwaitingPayouts', () => {
    let escrowCompletionEntity1: Partial<EscrowCompletionEntity>;
    let processPayoutsBatchMock: jest.SpyInstance;

    beforeEach(() => {
      escrowCompletionEntity1 = {
        id: 1,
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        finalResultsUrl: MOCK_FILE_URL,
        finalResultsHash: MOCK_FILE_HASH,
        status: EscrowCompletionStatus.AWAITING_PAYOUTS,
        waitUntil: new Date(),
        retriesCount: 0,
      };

      processPayoutsBatchMock = jest
        .spyOn(escrowCompletionService as any, 'processPayoutsBatch')
        .mockResolvedValue(undefined);
    });

    afterAll(() => {
      processPayoutsBatchMock.mockRestore();
    });

    it('should move completion entity to status paid when all payouts finished', async () => {
      jest
        .spyOn(escrowCompletionRepository, 'findByStatus')
        .mockResolvedValueOnce([escrowCompletionEntity1 as any]);

      jest
        .spyOn(escrowPayoutsBatchRepository, 'findForEscrowCompletionTracking')
        .mockResolvedValueOnce([
          {
            escrowCompletionTrackingId: escrowCompletionEntity1.id,
            payouts: [MOCK_ADDRESS_PAYOUT],
            payoutsHash: 'test-hash',
          },
        ] as any);

      const updateOneEscrowCompletionMock = jest
        .spyOn(escrowCompletionRepository, 'updateOne')
        .mockResolvedValue(escrowCompletionEntity1 as any);

      await escrowCompletionService.processAwaitingPayouts();

      expect(processPayoutsBatchMock).toHaveBeenCalledTimes(1);

      expect(updateOneEscrowCompletionMock).toHaveBeenCalledTimes(1);
      expect(updateOneEscrowCompletionMock).toHaveBeenCalledWith({
        ...escrowCompletionEntity1,
        status: EscrowCompletionStatus.PAID,
      });
    });

    it('should handle errors and keep processing other entities', async () => {
      jest
        .spyOn(escrowCompletionRepository, 'findByStatus')
        .mockResolvedValueOnce([escrowCompletionEntity1 as any]);

      const numBathes = 2;
      jest
        .spyOn(escrowPayoutsBatchRepository, 'findForEscrowCompletionTracking')
        .mockResolvedValueOnce(
          Array.from(
            { length: numBathes },
            () =>
              ({
                escrowCompletionTrackingId: escrowCompletionEntity1.id,
                payouts: [MOCK_ADDRESS_PAYOUT],
                payoutsHash: 'test-hash',
              }) as any,
          ),
        );

      processPayoutsBatchMock.mockRejectedValueOnce(new Error('Failed payout'));

      const updateOneEscrowCompletionMock = jest
        .spyOn(escrowCompletionRepository, 'updateOne')
        .mockResolvedValue(escrowCompletionEntity1 as any);

      await escrowCompletionService.processAwaitingPayouts();

      expect(processPayoutsBatchMock).toHaveBeenCalledTimes(2);

      expect(updateOneEscrowCompletionMock).toHaveBeenCalledTimes(1);
      expect(updateOneEscrowCompletionMock).toHaveBeenCalledWith({
        ...escrowCompletionEntity1,
        retriesCount: 1,
      });
    });
  });

  describe('processPayoutsBatch', () => {
    const escrowCompletionEntity = {
      id: 1,
      chainId: ChainId.LOCALHOST,
      escrowAddress: MOCK_ADDRESS,
      finalResultsUrl: MOCK_FILE_URL,
      finalResultsHash: MOCK_FILE_HASH,
      status: EscrowCompletionStatus.AWAITING_PAYOUTS,
      waitUntil: new Date(),
      retriesCount: 0,
    };
    const rawTransaction = {
      from: MOCK_REPUTATION_ORACLE_ADDRESS,
      to: MOCK_ADDRESS,
      data: '0xtest-encoded-contact-data',
      nonce: 0,
    };

    beforeAll(() => {
      ESCROW_CLIENT_MOCK.createBulkPayoutTransaction.mockImplementation(
        (...args) => {
          const txOptions = args.at(-1);
          return {
            ...rawTransaction,
            nonce: txOptions.nonce ?? rawTransaction.nonce,
          };
        },
      );
    });

    it('should correctly process payouts batch at first try', async () => {
      const updateOneBatchSpy = jest.spyOn(
        escrowPayoutsBatchRepository,
        'updateOne',
      );

      const payoutsBatch = {
        id: 1,
        payouts: [MOCK_ADDRESS_PAYOUT],
        payoutsHash: 'test-payouts-hash',
        txNonce: null,
      };

      await (escrowCompletionService as any).processPayoutsBatch(
        escrowCompletionEntity,
        { ...payoutsBatch },
      );

      expect(updateOneBatchSpy).toHaveBeenNthCalledWith(1, {
        ...payoutsBatch,
        txNonce: rawTransaction.nonce,
      });
      expect(signerMock.sendTransaction).toHaveBeenCalledTimes(1);
      expect(signerMock.sendTransaction).toHaveBeenLastCalledWith(
        rawTransaction,
      );
    });

    it('should reuse nonce if exists in batch', async () => {
      const updateOneBatchSpy = jest.spyOn(
        escrowPayoutsBatchRepository,
        'updateOne',
      );

      const payoutsBatch = {
        id: 1,
        payouts: [MOCK_ADDRESS_PAYOUT],
        payoutsHash: 'test-payouts-hash',
        txNonce: 15,
      };

      await (escrowCompletionService as any).processPayoutsBatch(
        escrowCompletionEntity,
        payoutsBatch,
      );

      expect(updateOneBatchSpy).toHaveBeenCalledWith({
        ...payoutsBatch,
      });
      expect(signerMock.sendTransaction).toHaveBeenCalledTimes(1);
      expect(signerMock.sendTransaction).toHaveBeenCalledWith({
        ...rawTransaction,
        nonce: payoutsBatch.txNonce,
      });
    });

    it('should erase tx data when nonce already used', async () => {
      const updateOneBatchSpy = jest.spyOn(
        escrowPayoutsBatchRepository,
        'updateOne',
      );
      const NONCE_EXPIRED_CODE = 'NONCE_EXPIRED';
      signerMock.sendTransaction.mockRejectedValueOnce({
        code: NONCE_EXPIRED_CODE,
      });

      const payoutsBatch = {
        id: 1,
        payouts: [MOCK_ADDRESS_PAYOUT],
        payoutsHash: 'test-payouts-hash',
        txNonce: 15,
      };

      let thrownError: any;
      try {
        await (escrowCompletionService as any).processPayoutsBatch(
          escrowCompletionEntity,
          { ...payoutsBatch },
        );
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeDefined();
      expect(thrownError.code).toBe(NONCE_EXPIRED_CODE);

      expect(updateOneBatchSpy).toHaveBeenLastCalledWith({
        ...payoutsBatch,
        txNonce: undefined,
      });
    });
  });
});
