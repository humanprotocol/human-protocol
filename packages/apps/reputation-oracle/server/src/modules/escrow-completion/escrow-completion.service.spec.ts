jest.mock('@human-protocol/sdk', () => {
  const mockedSdk = jest.createMockFromModule<
    typeof import('@human-protocol/sdk')
  >('@human-protocol/sdk');

  return {
    ...mockedSdk,
    ESCROW_BULK_PAYOUT_MAX_ITEMS: 2,
  };
});

import * as crypto from 'crypto';

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import {
  EscrowClient,
  EscrowStatus,
  EscrowUtils,
  IEscrow,
  IOperator,
  OperatorUtils,
} from '@human-protocol/sdk';
import { Test } from '@nestjs/testing';
import stringify from 'json-stable-stringify';
import _ from 'lodash';

import { CvatJobType, FortuneJobType } from '@/common/enums';
import { ServerConfigService } from '@/config';
import { ReputationService } from '@/modules/reputation';
import { StorageService } from '@/modules/storage';
import { WalletWithProvider, Web3Service } from '@/modules/web3';
import { generateTestnetChainId } from '@/modules/web3/fixtures';
import { OutgoingWebhookService } from '@/modules/webhook';
import { createSignerMock, type SignerMock } from '~/test/fixtures/web3';

import { EscrowCompletionStatus } from './constants';
import { EscrowCompletionRepository } from './escrow-completion.repository';
import { EscrowCompletionService } from './escrow-completion.service';
import { EscrowPayoutsBatchRepository } from './escrow-payouts-batch.repository';
import { generateFortuneManifest } from './fixtures';
import {
  generateEscrowCompletion,
  generateEscrowPayoutsBatch,
} from './fixtures/escrow-completion';
import {
  AudinoPayoutsCalculator,
  CvatPayoutsCalculator,
  FortunePayoutsCalculator,
} from './payouts-calculation';
import {
  AudinoResultsProcessor,
  CvatResultsProcessor,
  FortuneResultsProcessor,
} from './results-processing';

const mockServerConfigService = {
  maxRetryCount: faker.number.int({ min: 2, max: 5 }),
};

const mockEscrowCompletionRepository = createMock<EscrowCompletionRepository>();
const mockEscrowPayoutsBatchRepository =
  createMock<EscrowPayoutsBatchRepository>();
const mockWeb3Service = createMock<Web3Service>();
const mockStorageService = createMock<StorageService>();
const mockOutgoingWebhookService = createMock<OutgoingWebhookService>();
const mockReputationService = createMock<ReputationService>();
const mockFortuneResultsProcessor = createMock<FortuneResultsProcessor>();
const mockCvatResultsProcessor = createMock<CvatResultsProcessor>();
const mockFortunePayoutsCalculator = createMock<FortunePayoutsCalculator>();
const mockCvatPayoutsCalculator = createMock<CvatPayoutsCalculator>();

const mockedEscrowClient = jest.mocked(EscrowClient);
const mockedEscrowUtils = jest.mocked(EscrowUtils);
const mockedOperatorUtils = jest.mocked(OperatorUtils);

describe('EscrowCompletionService', () => {
  let service: EscrowCompletionService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        EscrowCompletionService,
        {
          provide: ServerConfigService,
          useValue: mockServerConfigService,
        },
        {
          provide: EscrowCompletionRepository,
          useValue: mockEscrowCompletionRepository,
        },
        {
          provide: EscrowPayoutsBatchRepository,
          useValue: mockEscrowPayoutsBatchRepository,
        },
        {
          provide: Web3Service,
          useValue: mockWeb3Service,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: OutgoingWebhookService,
          useValue: mockOutgoingWebhookService,
        },
        {
          provide: ReputationService,
          useValue: mockReputationService,
        },
        {
          provide: FortuneResultsProcessor,
          useValue: mockFortuneResultsProcessor,
        },
        {
          provide: CvatResultsProcessor,
          useValue: mockCvatResultsProcessor,
        },
        {
          provide: FortunePayoutsCalculator,
          useValue: mockFortunePayoutsCalculator,
        },
        {
          provide: CvatPayoutsCalculator,
          useValue: mockCvatPayoutsCalculator,
        },
        {
          provide: AudinoResultsProcessor,
          useValue: createMock(),
        },
        {
          provide: AudinoPayoutsCalculator,
          useValue: createMock(),
        },
      ],
    }).compile();

    service = moduleRef.get<EscrowCompletionService>(EscrowCompletionService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createEscrowCompletion', () => {
    it('creates escrow completion tracking record with proper defaults', async () => {
      const chainId = generateTestnetChainId();
      const escrowAddress = faker.finance.ethereumAddress();

      const now = Date.now();
      jest.useFakeTimers({ now });

      await service.createEscrowCompletion(chainId, escrowAddress);

      jest.useRealTimers();

      expect(mockEscrowCompletionRepository.createUnique).toHaveBeenCalledTimes(
        1,
      );
      expect(mockEscrowCompletionRepository.createUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          chainId,
          escrowAddress,
          status: 'pending',
          retriesCount: 0,
          waitUntil: new Date(now),
        }),
      );
    });
  });

  describe('processPendingRecords', () => {
    const mockGetEscrowStatus = jest.fn();
    let spyOnCreateEscrowPayoutsBatch: jest.SpyInstance;

    beforeAll(() => {
      spyOnCreateEscrowPayoutsBatch = jest
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .spyOn(service as any, 'createEscrowPayoutsBatch')
        .mockImplementation();
    });

    afterAll(() => {
      spyOnCreateEscrowPayoutsBatch.mockRestore();
    });

    beforeEach(() => {
      mockedEscrowClient.build.mockResolvedValue({
        getStatus: mockGetEscrowStatus,
      } as unknown as EscrowClient);
    });

    describe('handle failures', () => {
      const testError = new Error(faker.lorem.sentence());

      beforeEach(() => {
        mockGetEscrowStatus.mockRejectedValue(testError);
      });

      it('should process multiple items and handle failure for each', async () => {
        const pendingRecords = [
          generateEscrowCompletion(EscrowCompletionStatus.PENDING),
          generateEscrowCompletion(EscrowCompletionStatus.PENDING),
        ];
        mockEscrowCompletionRepository.findByStatus.mockResolvedValueOnce(
          _.cloneDeep(pendingRecords),
        );

        await service.processPendingRecords();

        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledTimes(
          2,
        );
        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith(
          expect.objectContaining({
            id: pendingRecords[0].id,
            retriesCount: pendingRecords[0].retriesCount + 1,
          }),
        );
        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith(
          expect.objectContaining({
            id: pendingRecords[1].id,
            retriesCount: pendingRecords[0].retriesCount + 1,
          }),
        );
      });

      it('should handle failure for item that has 1 retry left', async () => {
        const pendingRecord = generateEscrowCompletion(
          EscrowCompletionStatus.PENDING,
        );
        pendingRecord.retriesCount = mockServerConfigService.maxRetryCount - 1;
        mockEscrowCompletionRepository.findByStatus.mockResolvedValueOnce([
          {
            ...pendingRecord,
          },
        ]);

        await service.processPendingRecords();

        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledTimes(
          1,
        );
        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith({
          ...pendingRecord,
          retriesCount: pendingRecord.retriesCount + 1,
          waitUntil: expect.any(Date),
        });
      });

      it('should handle failure and set failed status for item that has no retries left', async () => {
        const pendingRecord = generateEscrowCompletion(
          EscrowCompletionStatus.PENDING,
        );
        pendingRecord.retriesCount = mockServerConfigService.maxRetryCount;
        mockEscrowCompletionRepository.findByStatus.mockResolvedValueOnce([
          {
            ...pendingRecord,
          },
        ]);

        await service.processPendingRecords();

        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledTimes(
          1,
        );
        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith({
          ...pendingRecord,
          failureDetail: `Error message: ${testError.message}`,
          status: 'failed',
        });
      });
    });

    it('should skip final results and payout batches processing if escrow status is not pending', async () => {
      const pendingRecord = generateEscrowCompletion(
        EscrowCompletionStatus.PENDING,
      );
      mockEscrowCompletionRepository.findByStatus.mockResolvedValueOnce([
        {
          ...pendingRecord,
        },
      ]);
      mockGetEscrowStatus.mockResolvedValue(
        faker.helpers.arrayElement([
          EscrowStatus.Launched,
          EscrowStatus.Cancelled,
          EscrowStatus.Complete,
          EscrowStatus.Paid,
          EscrowStatus.Partial,
        ]),
      );

      await service.processPendingRecords();

      expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledTimes(1);
      expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith({
        ...pendingRecord,
        status: EscrowCompletionStatus.AWAITING_PAYOUTS,
      });
    });

    it('should correctly process escrow that has pending status', async () => {
      const pendingRecord = generateEscrowCompletion(
        EscrowCompletionStatus.PENDING,
      );
      mockEscrowCompletionRepository.findByStatus.mockResolvedValueOnce([
        {
          ...pendingRecord,
        },
      ]);
      mockGetEscrowStatus.mockResolvedValue(EscrowStatus.Pending);

      const manifestUrl = faker.internet.url();
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        manifest: manifestUrl,
      } as unknown as IEscrow);

      const fortuneManifest = generateFortuneManifest();
      mockStorageService.downloadJsonLikeData.mockResolvedValueOnce(
        fortuneManifest,
      );
      const finalResultsUrl = faker.internet.url();
      const finalResultsHash = faker.string.hexadecimal({ length: 42 });
      mockFortuneResultsProcessor.storeResults.mockResolvedValueOnce({
        url: finalResultsUrl,
        hash: finalResultsHash,
      });
      const calculatedPayouts = [
        {
          address: faker.finance.ethereumAddress(),
          amount: faker.number.bigInt(),
        },
      ];
      mockFortunePayoutsCalculator.calculate.mockResolvedValueOnce(
        calculatedPayouts,
      );

      await service.processPendingRecords();

      expect(mockedEscrowUtils.getEscrow).toHaveBeenCalledWith(
        pendingRecord.chainId,
        pendingRecord.escrowAddress,
      );
      expect(mockStorageService.downloadJsonLikeData).toHaveBeenCalledWith(
        manifestUrl,
      );
      expect(mockFortuneResultsProcessor.storeResults).toHaveBeenCalledTimes(1);
      expect(mockFortuneResultsProcessor.storeResults).toHaveBeenCalledWith(
        pendingRecord.chainId,
        pendingRecord.escrowAddress,
        fortuneManifest,
      );
      expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: pendingRecord.id,
          finalResultsUrl,
          finalResultsHash,
        }),
      );

      expect(mockFortunePayoutsCalculator.calculate).toHaveBeenCalledTimes(1);
      expect(mockFortunePayoutsCalculator.calculate).toHaveBeenCalledWith({
        manifest: fortuneManifest,
        finalResultsUrl,
        chainId: pendingRecord.chainId,
        escrowAddress: pendingRecord.escrowAddress,
      });
      expect(spyOnCreateEscrowPayoutsBatch).toHaveBeenCalledTimes(1);
      expect(spyOnCreateEscrowPayoutsBatch).toHaveBeenCalledWith(
        pendingRecord.id,
        calculatedPayouts,
      );

      expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: pendingRecord.id,
          status: EscrowCompletionStatus.AWAITING_PAYOUTS,
        }),
      );

      expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledTimes(2);
    });

    it('should prepare multiple batches if amount of receivers exceeds the limit', async () => {
      const pendingRecord = generateEscrowCompletion(
        EscrowCompletionStatus.PENDING,
      );
      pendingRecord.finalResultsUrl = faker.internet.url();
      pendingRecord.finalResultsHash = faker.string.hexadecimal({ length: 42 });

      mockEscrowCompletionRepository.findByStatus.mockResolvedValueOnce([
        {
          ...pendingRecord,
        },
      ]);
      mockGetEscrowStatus.mockResolvedValue(EscrowStatus.Pending);
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce(
        {} as unknown as IEscrow,
      );
      mockStorageService.downloadJsonLikeData.mockResolvedValueOnce(
        generateFortuneManifest(),
      );

      const firstAddressPayout = {
        address: `0x1${faker.finance.ethereumAddress().slice(3)}`,
        amount: faker.number.bigInt(),
      };
      const secondAddressPayout = {
        address: `0x2${faker.finance.ethereumAddress().slice(3)}`,
        amount: faker.number.bigInt(),
      };
      const thirdAddressPayout = {
        address: `0x3${faker.finance.ethereumAddress().slice(3)}`,
        amount: faker.number.bigInt(),
      };

      mockFortunePayoutsCalculator.calculate.mockResolvedValueOnce(
        faker.helpers.shuffle([
          firstAddressPayout,
          secondAddressPayout,
          thirdAddressPayout,
        ]),
      );

      await service.processPendingRecords();

      expect(spyOnCreateEscrowPayoutsBatch).toHaveBeenCalledTimes(2);
      expect(spyOnCreateEscrowPayoutsBatch).toHaveBeenCalledWith(
        pendingRecord.id,
        [firstAddressPayout, secondAddressPayout],
      );
      expect(spyOnCreateEscrowPayoutsBatch).toHaveBeenCalledWith(
        pendingRecord.id,
        [thirdAddressPayout],
      );

      expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledTimes(1);
      expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: pendingRecord.id,
          status: EscrowCompletionStatus.AWAITING_PAYOUTS,
        }),
      );
    });

    it('should handle missing escrow data during pending processing and mark as failed when out of retries', async () => {
      const pendingRecord = generateEscrowCompletion(
        EscrowCompletionStatus.PENDING,
      );
      pendingRecord.retriesCount = mockServerConfigService.maxRetryCount;
      mockEscrowCompletionRepository.findByStatus.mockResolvedValueOnce([
        {
          ...pendingRecord,
        },
      ]);

      mockGetEscrowStatus.mockResolvedValue(EscrowStatus.Pending);
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce(null);

      await service.processPendingRecords();

      expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledTimes(1);
      expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith({
        ...pendingRecord,
        failureDetail: 'Error message: Escrow data is missing',
        status: 'failed',
      });
    });
  });

  describe('createEscrowPayoutsBatch', () => {
    it('should create payouts batch with correct data', async () => {
      const payoutsBatch = [
        {
          address: faker.finance.ethereumAddress(),
          amount: faker.number.bigInt(),
        },
      ];
      const escrowCompletionId = faker.number.int();

      await service['createEscrowPayoutsBatch'](
        escrowCompletionId,
        payoutsBatch,
      );

      const payoutsWithStringifiedAmount = payoutsBatch.map((b) => ({
        address: b.address,
        amount: b.amount.toString(),
      }));

      const expectedHash = crypto
        .createHash('sha256')
        .update(stringify(payoutsWithStringifiedAmount) as string)
        .digest('hex');

      expect(
        mockEscrowPayoutsBatchRepository.createUnique,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockEscrowPayoutsBatchRepository.createUnique,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          escrowCompletionTrackingId: escrowCompletionId,
          payouts: payoutsWithStringifiedAmount,
          payoutsHash: expectedHash,
          txNonce: undefined,
        }),
      );
    });
  });

  describe('processAwaitingPayouts', () => {
    let spyOnProcessPayoutsBatch: jest.SpyInstance;

    beforeAll(() => {
      spyOnProcessPayoutsBatch = jest
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .spyOn(service as any, 'processPayoutsBatch')
        .mockImplementation();
    });

    afterAll(() => {
      spyOnProcessPayoutsBatch.mockRestore();
    });

    describe('handle failures', () => {
      const testError = new Error(faker.lorem.sentence());

      beforeEach(() => {
        mockEscrowPayoutsBatchRepository.findForEscrowCompletionTracking.mockResolvedValue(
          [generateEscrowPayoutsBatch()],
        );
      });

      it('should process multiple items and handle failure for each', async () => {
        const awaitingPayoutsRecords = [
          generateEscrowCompletion(EscrowCompletionStatus.AWAITING_PAYOUTS),
          generateEscrowCompletion(EscrowCompletionStatus.AWAITING_PAYOUTS),
        ];
        mockEscrowCompletionRepository.findByStatus.mockResolvedValueOnce(
          _.cloneDeep(awaitingPayoutsRecords),
        );
        spyOnProcessPayoutsBatch.mockRejectedValue(testError);

        await service.processAwaitingPayouts();

        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledTimes(
          2,
        );
        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith(
          expect.objectContaining({
            id: awaitingPayoutsRecords[0].id,
            retriesCount: awaitingPayoutsRecords[0].retriesCount + 1,
          }),
        );
        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith(
          expect.objectContaining({
            id: awaitingPayoutsRecords[1].id,
            retriesCount: awaitingPayoutsRecords[1].retriesCount + 1,
          }),
        );
      });

      it('should handle failure for item that has 1 retry left', async () => {
        const awaitingPayoutsRecord = generateEscrowCompletion(
          EscrowCompletionStatus.AWAITING_PAYOUTS,
        );
        awaitingPayoutsRecord.retriesCount =
          mockServerConfigService.maxRetryCount - 1;
        mockEscrowCompletionRepository.findByStatus.mockResolvedValueOnce([
          {
            ...awaitingPayoutsRecord,
          },
        ]);
        spyOnProcessPayoutsBatch.mockRejectedValue(testError);

        await service.processAwaitingPayouts();

        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledTimes(
          1,
        );
        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith({
          ...awaitingPayoutsRecord,
          retriesCount: awaitingPayoutsRecord.retriesCount + 1,
          waitUntil: expect.any(Date),
        });
      });

      it('should handle failure and set failed status for item that has no retries left', async () => {
        const awaitingPayoutsRecord = generateEscrowCompletion(
          EscrowCompletionStatus.AWAITING_PAYOUTS,
        );
        awaitingPayoutsRecord.retriesCount =
          mockServerConfigService.maxRetryCount;
        mockEscrowCompletionRepository.findByStatus.mockResolvedValueOnce([
          {
            ...awaitingPayoutsRecord,
          },
        ]);
        spyOnProcessPayoutsBatch.mockRejectedValue(testError);

        await service.processAwaitingPayouts();

        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledTimes(
          1,
        );
        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith({
          ...awaitingPayoutsRecord,
          failureDetail: 'Error message: Not all payouts batches succeeded',
          status: 'failed',
        });
      });

      it('should not mark as paid if not all payout batches succeeded', async () => {
        const awaitingPayoutsRecord = generateEscrowCompletion(
          EscrowCompletionStatus.AWAITING_PAYOUTS,
        );
        awaitingPayoutsRecord.retriesCount =
          mockServerConfigService.maxRetryCount - 1;
        mockEscrowCompletionRepository.findByStatus.mockResolvedValueOnce([
          {
            ...awaitingPayoutsRecord,
          },
        ]);
        mockEscrowPayoutsBatchRepository.findForEscrowCompletionTracking.mockResolvedValue(
          [generateEscrowPayoutsBatch(), generateEscrowPayoutsBatch()],
        );
        spyOnProcessPayoutsBatch.mockRejectedValueOnce(testError);

        await service.processAwaitingPayouts();

        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledTimes(
          1,
        );
        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith({
          ...awaitingPayoutsRecord,
          retriesCount: awaitingPayoutsRecord.retriesCount + 1,
          waitUntil: expect.any(Date),
        });
      });
    });

    it('should correctly process payouts batches', async () => {
      const awaitingPayoutsRecord = generateEscrowCompletion(
        EscrowCompletionStatus.AWAITING_PAYOUTS,
      );
      mockEscrowCompletionRepository.findByStatus.mockResolvedValueOnce([
        {
          ...awaitingPayoutsRecord,
        },
      ]);
      const firstPayoutsBatch = generateEscrowPayoutsBatch();
      const secondPayoutsBatch = generateEscrowPayoutsBatch();
      mockEscrowPayoutsBatchRepository.findForEscrowCompletionTracking.mockResolvedValue(
        [firstPayoutsBatch, secondPayoutsBatch],
      );

      await service.processAwaitingPayouts();

      expect(
        mockEscrowPayoutsBatchRepository.findForEscrowCompletionTracking,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockEscrowPayoutsBatchRepository.findForEscrowCompletionTracking,
      ).toHaveBeenCalledWith(awaitingPayoutsRecord.id);

      expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledTimes(1);
      expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith({
        ...awaitingPayoutsRecord,
        status: 'paid',
      });

      /**
       * This entity is used by reference while processing,
       * so if we pass it as is to matcher - it fails
       * due to having different status
       */
      const expectedEscrowCompletionArg = expect.objectContaining({
        chainId: awaitingPayoutsRecord.chainId,
        escrowAddress: awaitingPayoutsRecord.escrowAddress,
        finalResultsUrl: awaitingPayoutsRecord.finalResultsUrl,
        finalResultsHash: awaitingPayoutsRecord.finalResultsHash,
      });

      expect(spyOnProcessPayoutsBatch).toHaveBeenCalledTimes(2);
      expect(spyOnProcessPayoutsBatch).toHaveBeenCalledWith(
        expectedEscrowCompletionArg,
        firstPayoutsBatch,
      );
      expect(spyOnProcessPayoutsBatch).toHaveBeenCalledWith(
        expectedEscrowCompletionArg,
        secondPayoutsBatch,
      );
    });
  });

  describe('processPayoutsBatch', () => {
    let mockedSigner: SignerMock;
    const mockedCreateBulkPayoutTransaction = jest.fn();
    let mockedRawTransaction: { nonce: number };

    beforeEach(() => {
      mockedSigner = createSignerMock();
      mockWeb3Service.getSigner.mockReturnValueOnce(
        mockedSigner as unknown as WalletWithProvider,
      );

      mockedEscrowClient.build.mockResolvedValue({
        createBulkPayoutTransaction: mockedCreateBulkPayoutTransaction,
      } as unknown as EscrowClient);

      mockedRawTransaction = {
        nonce: faker.number.int(),
      };
      mockedCreateBulkPayoutTransaction.mockResolvedValueOnce(
        mockedRawTransaction,
      );
    });

    it('should succesfully process payouts batch', async () => {
      const awaitingPayoutsRecord = generateEscrowCompletion(
        EscrowCompletionStatus.AWAITING_PAYOUTS,
      );
      const payoutsBatch = generateEscrowPayoutsBatch();

      await service['processPayoutsBatch'](awaitingPayoutsRecord, {
        ...payoutsBatch,
      });

      expect(mockEscrowPayoutsBatchRepository.updateOne).toHaveBeenCalledTimes(
        1,
      );
      expect(mockEscrowPayoutsBatchRepository.updateOne).toHaveBeenCalledWith({
        ...payoutsBatch,
        txNonce: mockedRawTransaction.nonce,
      });

      expect(mockedSigner.sendTransaction).toHaveBeenCalledTimes(1);
      expect(mockedSigner.sendTransaction).toHaveBeenCalledWith(
        mockedRawTransaction,
      );
      expect(mockedSigner.__transactionResponse.wait).toHaveBeenCalledTimes(1);

      expect(mockEscrowPayoutsBatchRepository.deleteOne).toHaveBeenCalledTimes(
        1,
      );
      expect(mockEscrowPayoutsBatchRepository.deleteOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: payoutsBatch.id,
        }),
      );
    });

    it('should reset nonce if expired', async () => {
      const awaitingPayoutsRecord = generateEscrowCompletion(
        EscrowCompletionStatus.AWAITING_PAYOUTS,
      );
      const payoutsBatch = generateEscrowPayoutsBatch();

      const testError = new Error('Synthetic error');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (testError as any).code = 'NONCE_EXPIRED';

      mockedSigner.sendTransaction.mockRejectedValueOnce(testError);

      let thrownError;
      try {
        await service['processPayoutsBatch'](awaitingPayoutsRecord, {
          ...payoutsBatch,
        });
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toEqual(testError);

      expect(
        mockEscrowPayoutsBatchRepository.updateOne,
      ).toHaveBeenNthCalledWith(2, {
        ...payoutsBatch,
        txNonce: null,
      });

      expect(mockEscrowPayoutsBatchRepository.deleteOne).toHaveBeenCalledTimes(
        0,
      );
    });

    it('should not update nonce if already set', async () => {
      const awaitingPayoutsRecord = generateEscrowCompletion(
        EscrowCompletionStatus.AWAITING_PAYOUTS,
      );
      const payoutsBatch = generateEscrowPayoutsBatch();
      payoutsBatch.txNonce = mockedRawTransaction.nonce;

      await service['processPayoutsBatch'](awaitingPayoutsRecord, {
        ...payoutsBatch,
      });

      expect(mockEscrowPayoutsBatchRepository.updateOne).toHaveBeenCalledTimes(
        0,
      );
    });

    it('throws when transaction is failed', async () => {
      const awaitingPayoutsRecord = generateEscrowCompletion(
        EscrowCompletionStatus.AWAITING_PAYOUTS,
      );
      const payoutsBatch = generateEscrowPayoutsBatch();
      payoutsBatch.txNonce = mockedRawTransaction.nonce;

      const testError = new Error('Synthetic error');

      mockedSigner.__transactionResponse.wait.mockRejectedValueOnce(testError);

      let thrownError;
      try {
        await service['processPayoutsBatch'](awaitingPayoutsRecord, {
          ...payoutsBatch,
        });
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toEqual(testError);

      expect(mockEscrowPayoutsBatchRepository.updateOne).toHaveBeenCalledTimes(
        0,
      );
      expect(mockEscrowPayoutsBatchRepository.deleteOne).toHaveBeenCalledTimes(
        0,
      );
    });
  });

  describe('processPaidEscrows', () => {
    const mockGetEscrowStatus = jest.fn();
    const mockCompleteEscrow = jest.fn();
    let launcherAddress: string;
    let exchangeOracleAddress: string;

    beforeEach(() => {
      mockedEscrowClient.build.mockResolvedValue({
        getStatus: mockGetEscrowStatus,
        complete: mockCompleteEscrow,
      } as unknown as EscrowClient);

      launcherAddress = faker.finance.ethereumAddress();
      exchangeOracleAddress = faker.finance.ethereumAddress();
    });

    describe('handle failures', () => {
      const testError = new Error(faker.lorem.sentence());

      beforeEach(() => {
        mockGetEscrowStatus.mockRejectedValue(testError);
        mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
          launcher: launcherAddress,
          exchangeOracle: exchangeOracleAddress,
        } as unknown as IEscrow);
      });

      it('should process multiple items and handle failure for each', async () => {
        const paidPayoutsRecords = [
          generateEscrowCompletion(EscrowCompletionStatus.PAID),
          generateEscrowCompletion(EscrowCompletionStatus.PAID),
        ];
        mockEscrowCompletionRepository.findByStatus.mockResolvedValueOnce(
          _.cloneDeep(paidPayoutsRecords),
        );

        await service.processPaidEscrows();

        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledTimes(
          2,
        );
        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith(
          expect.objectContaining({
            id: paidPayoutsRecords[0].id,
            retriesCount: paidPayoutsRecords[0].retriesCount + 1,
          }),
        );
        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith(
          expect.objectContaining({
            id: paidPayoutsRecords[1].id,
            retriesCount: paidPayoutsRecords[1].retriesCount + 1,
          }),
        );
      });

      it('should handle failure for item that has 1 retry left', async () => {
        const paidPayoutsRecord = generateEscrowCompletion(
          EscrowCompletionStatus.PAID,
        );
        paidPayoutsRecord.retriesCount =
          mockServerConfigService.maxRetryCount - 1;
        mockEscrowCompletionRepository.findByStatus.mockResolvedValueOnce([
          {
            ...paidPayoutsRecord,
          },
        ]);

        await service.processPaidEscrows();

        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledTimes(
          1,
        );
        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith({
          ...paidPayoutsRecord,
          retriesCount: paidPayoutsRecord.retriesCount + 1,
          waitUntil: expect.any(Date),
        });
      });

      it('should handle failure and set failed status for item that has no retries left', async () => {
        const paidPayoutsRecord = generateEscrowCompletion(
          EscrowCompletionStatus.PAID,
        );
        paidPayoutsRecord.retriesCount = mockServerConfigService.maxRetryCount;
        mockEscrowCompletionRepository.findByStatus.mockResolvedValueOnce([
          {
            ...paidPayoutsRecord,
          },
        ]);

        await service.processPaidEscrows();

        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledTimes(
          1,
        );
        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith({
          ...paidPayoutsRecord,
          failureDetail: `Error message: ${testError.message}`,
          status: 'failed',
        });
      });

      it('should handle failure when no webhook url for oracle', async () => {
        const paidPayoutsRecord = generateEscrowCompletion(
          EscrowCompletionStatus.PAID,
        );
        paidPayoutsRecord.retriesCount = mockServerConfigService.maxRetryCount;
        mockEscrowCompletionRepository.findByStatus.mockResolvedValueOnce([
          {
            ...paidPayoutsRecord,
          },
        ]);
        mockGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.Paid);
        mockedOperatorUtils.getOperator.mockResolvedValue({
          webhookUrl: '',
        } as IOperator);

        await service.processPaidEscrows();

        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledTimes(
          1,
        );
        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith({
          ...paidPayoutsRecord,
          failureDetail: 'Error message: Webhook url is no set for oracle',
          status: 'failed',
        });
      });

      it('should handle error when creating webhooks', async () => {
        const paidPayoutsRecord = generateEscrowCompletion(
          EscrowCompletionStatus.PAID,
        );
        paidPayoutsRecord.retriesCount = mockServerConfigService.maxRetryCount;
        mockEscrowCompletionRepository.findByStatus.mockResolvedValueOnce([
          {
            ...paidPayoutsRecord,
          },
        ]);
        mockGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.Paid);
        mockedOperatorUtils.getOperator.mockResolvedValue({
          webhookUrl: faker.internet.url(),
        } as IOperator);
        mockOutgoingWebhookService.createOutgoingWebhook.mockRejectedValueOnce(
          testError,
        );

        await service.processPaidEscrows();

        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledTimes(
          1,
        );
        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith({
          ...paidPayoutsRecord,
          failureDetail: expect.stringContaining(
            'Failed to create outgoing webhook for oracle. Address: 0x',
          ),
          status: 'failed',
        });
      });
    });

    it.each([EscrowStatus.Partial, EscrowStatus.Paid])(
      'should properly complete escrow with status "%s"',
      async (escrowStatus) => {
        mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
          launcher: launcherAddress,
          exchangeOracle: exchangeOracleAddress,
        } as unknown as IEscrow);
        mockGetEscrowStatus.mockResolvedValueOnce(escrowStatus);
        const mockGasPrice = faker.number.bigInt();
        mockWeb3Service.calculateGasPrice.mockResolvedValueOnce(mockGasPrice);

        const paidPayoutsRecord = generateEscrowCompletion(
          EscrowCompletionStatus.PAID,
        );
        mockEscrowCompletionRepository.findByStatus.mockResolvedValueOnce([
          {
            ...paidPayoutsRecord,
          },
        ]);

        const launcherWebhookUrl = faker.internet.url();
        const exchangeOracleWebhookUrl = faker.internet.url();
        mockedOperatorUtils.getOperator.mockImplementation(
          async (_chainId, address) => {
            let webhookUrl: string;
            switch (address) {
              case launcherAddress:
                webhookUrl = launcherWebhookUrl;
                break;
              case exchangeOracleAddress:
                webhookUrl = exchangeOracleWebhookUrl;
                break;
              default:
                webhookUrl = faker.internet.url();
                break;
            }
            return { webhookUrl } as IOperator;
          },
        );

        await service.processPaidEscrows();

        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledTimes(
          1,
        );
        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith({
          ...paidPayoutsRecord,
          status: 'completed',
        });
        expect(mockCompleteEscrow).toHaveBeenCalledWith(
          paidPayoutsRecord.escrowAddress,
          {
            gasPrice: mockGasPrice,
          },
        );
        expect(mockReputationService.assessEscrowParties).toHaveBeenCalledTimes(
          1,
        );
        expect(mockReputationService.assessEscrowParties).toHaveBeenCalledWith(
          paidPayoutsRecord.chainId,
          paidPayoutsRecord.escrowAddress,
        );

        const expectedWebhookData = {
          chainId: paidPayoutsRecord.chainId,
          escrowAddress: paidPayoutsRecord.escrowAddress,
          eventType: 'escrow_completed',
        };
        expect(
          mockOutgoingWebhookService.createOutgoingWebhook,
        ).toHaveBeenCalledTimes(2);
        expect(
          mockOutgoingWebhookService.createOutgoingWebhook,
        ).toHaveBeenCalledWith(expectedWebhookData, launcherWebhookUrl);
        expect(
          mockOutgoingWebhookService.createOutgoingWebhook,
        ).toHaveBeenCalledWith(expectedWebhookData, exchangeOracleWebhookUrl);
      },
    );

    it.each([
      EscrowStatus.Cancelled,
      EscrowStatus.Pending,
      EscrowStatus.Complete,
    ])(
      'should not comlete escrow if its status is not partial or paid [%#]',
      async (escrowStatus) => {
        mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
          launcher: launcherAddress,
          exchangeOracle: exchangeOracleAddress,
        } as unknown as IEscrow);
        mockGetEscrowStatus.mockResolvedValueOnce(escrowStatus);

        const paidPayoutsRecord = generateEscrowCompletion(
          EscrowCompletionStatus.PAID,
        );
        mockEscrowCompletionRepository.findByStatus.mockResolvedValueOnce([
          {
            ...paidPayoutsRecord,
          },
        ]);

        mockedOperatorUtils.getOperator.mockResolvedValue({
          webhookUrl: faker.internet.url(),
        } as IOperator);

        await service.processPaidEscrows();

        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledTimes(
          1,
        );
        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith({
          ...paidPayoutsRecord,
          status: 'completed',
        });
        expect(mockCompleteEscrow).toHaveBeenCalledTimes(0);
        expect(mockReputationService.assessEscrowParties).toHaveBeenCalledTimes(
          0,
        );
      },
    );

    it('should handle missing escrow data in paid processing and mark as failed when out of retries', async () => {
      const paidPayoutsRecord = generateEscrowCompletion(
        EscrowCompletionStatus.PAID,
      );
      paidPayoutsRecord.retriesCount = mockServerConfigService.maxRetryCount;
      mockEscrowCompletionRepository.findByStatus.mockResolvedValueOnce([
        {
          ...paidPayoutsRecord,
        },
      ]);

      mockGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.Paid);
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce(null);

      await service.processPaidEscrows();

      expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledTimes(1);
      expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith({
        ...paidPayoutsRecord,
        failureDetail: 'Error message: Escrow data is missing',
        status: 'failed',
      });
    });

    it('should handle missing operator data in paid processing and mark as failed when out of retries', async () => {
      const paidPayoutsRecord = generateEscrowCompletion(
        EscrowCompletionStatus.PAID,
      );
      paidPayoutsRecord.retriesCount = mockServerConfigService.maxRetryCount;
      mockEscrowCompletionRepository.findByStatus.mockResolvedValueOnce([
        {
          ...paidPayoutsRecord,
        },
      ]);

      mockGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.Paid);

      const launcher = faker.finance.ethereumAddress();
      const exchangeOracle = faker.finance.ethereumAddress();
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        launcher,
        exchangeOracle,
      } as unknown as IEscrow);

      mockedOperatorUtils.getOperator.mockResolvedValueOnce(null);

      await service.processPaidEscrows();

      expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledTimes(1);
      expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith({
        ...paidPayoutsRecord,
        failureDetail: 'Error message: Oracle data is missing',
        status: 'failed',
      });
    });
  });

  describe('getEscrowResultsProcessor', () => {
    it.each(Object.values(FortuneJobType))(
      'should return fortune processor for "%s" job type',
      (jobRequestType) => {
        expect(service['getEscrowResultsProcessor'](jobRequestType)).toBe(
          mockFortuneResultsProcessor,
        );
      },
    );
    it.each(Object.values(CvatJobType))(
      'should return cvat processor for "%s" job type',
      (jobRequestType) => {
        expect(service['getEscrowResultsProcessor'](jobRequestType)).toBe(
          mockCvatResultsProcessor,
        );
      },
    );
  });

  describe('getEscrowPayoutsCalculator', () => {
    it.each(Object.values(FortuneJobType))(
      'should return fortune calculator for "%s" job type',
      (jobRequestType) => {
        expect(service['getEscrowPayoutsCalculator'](jobRequestType)).toBe(
          mockFortunePayoutsCalculator,
        );
      },
    );
    it.each(Object.values(CvatJobType))(
      'should return cvat calculator for "%s" job type',
      (jobRequestType) => {
        expect(service['getEscrowPayoutsCalculator'](jobRequestType)).toBe(
          mockCvatPayoutsCalculator,
        );
      },
    );
  });
});
