jest.mock('@human-protocol/sdk', () => {
  const mockedSdk = jest.createMockFromModule<
    typeof import('@human-protocol/sdk')
  >('@human-protocol/sdk');

  return {
    ...mockedSdk,
    ESCROW_BULK_PAYOUT_MAX_ITEMS: 2,
  };
});

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { EscrowClient, EscrowStatus, EscrowUtils } from '@human-protocol/sdk';
import { Test } from '@nestjs/testing';

import { ServerConfigService } from '../../config/server-config.service';

import { ReputationService } from '../reputation/reputation.service';
import { StorageService } from '../storage/storage.service';
import { OutgoingWebhookService } from '../webhook/webhook-outgoing.service';
import { Web3Service } from '../web3/web3.service';
import { generateTestnetChainId } from '../web3/fixtures';

import { EscrowCompletionStatus } from './constants';
import { generateEscrowCompletion } from './fixtures/escrow-completion';
import { EscrowCompletionService } from './escrow-completion.service';
import { EscrowCompletionRepository } from './escrow-completion.repository';
import { EscrowPayoutsBatchRepository } from './escrow-payouts-batch.repository';
import {
  AudinoResultsProcessor,
  CvatResultsProcessor,
  FortuneResultsProcessor,
} from './results-processing';
import {
  AudinoPayoutsCalculator,
  CvatPayoutsCalculator,
  FortunePayoutsCalculator,
} from './payouts-calculation';
import { generateFortuneManifest } from './fixtures';

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
          pendingRecords,
        );

        await service.processPendingRecords();

        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledTimes(
          2,
        );
        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith(
          expect.objectContaining({
            id: pendingRecords[0].id,
          }),
        );
        expect(mockEscrowCompletionRepository.updateOne).toHaveBeenCalledWith(
          expect.objectContaining({
            id: pendingRecords[0].id,
          }),
        );
      });

      it('should handle failure for item that has retries left', async () => {
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

      it('should handle failure for item that has no retries left', async () => {
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

    it('should not process if escrow has pending status', async () => {
      const pendingRecord = generateEscrowCompletion(
        EscrowCompletionStatus.PENDING,
      );
      mockEscrowCompletionRepository.findByStatus.mockResolvedValueOnce([
        {
          ...pendingRecord,
        },
      ]);
      mockGetEscrowStatus.mockResolvedValue(faker.string.sample());

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
      mockedEscrowUtils.getEscrow.mockImplementationOnce(
        async (chainId, escrowAddress) => {
          if (
            chainId === pendingRecord.chainId &&
            escrowAddress === pendingRecord.escrowAddress
          ) {
            return { manifestUrl } as any;
          }
          throw new Error('Test escrow not found');
        },
      );

      const fortuneManifest = generateFortuneManifest();
      mockStorageService.downloadJsonLikeData.mockImplementationOnce(
        async (url) => {
          if (url === manifestUrl) {
            return fortuneManifest;
          }
          return null;
        },
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

    it('should prepare payout batches when too many payouts', async () => {
      const pendingRecord = generateEscrowCompletion(
        EscrowCompletionStatus.PENDING,
      );
      pendingRecord.finalResultsUrl = faker.internet.url();
      pendingRecord.finalResultsHash = faker.string.hexadecimal({ length: 40 });

      mockEscrowCompletionRepository.findByStatus.mockResolvedValueOnce([
        {
          ...pendingRecord,
        },
      ]);
      mockGetEscrowStatus.mockResolvedValue(EscrowStatus.Pending);
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({} as any);
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
  });
});
