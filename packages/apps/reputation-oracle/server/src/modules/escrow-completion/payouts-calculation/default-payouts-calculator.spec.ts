jest.mock('@human-protocol/sdk');

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { EscrowClient } from '@human-protocol/sdk';
import { Test } from '@nestjs/testing';

import { MarketingJobType } from '@/common/enums';
import {
  BaseFinalResult,
  BaseManifest,
  VerificationResult,
} from '@/common/types';
import { StorageService } from '@/modules/storage';
import { Web3Service } from '@/modules/web3';
import { generateTestnetChainId } from '@/modules/web3/fixtures';

import { DefaultPayoutsCalculator } from './default-payouts-calculator';

const mockedStorageService = createMock<StorageService>();
const mockedWeb3Service = createMock<Web3Service>();
const mockedEscrowClient = jest.mocked(EscrowClient);

describe('DefaultPayoutsCalculator', () => {
  let calculator: DefaultPayoutsCalculator;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DefaultPayoutsCalculator,
        {
          provide: StorageService,
          useValue: mockedStorageService,
        },
        {
          provide: Web3Service,
          useValue: mockedWeb3Service,
        },
      ],
    }).compile();

    calculator = moduleRef.get<DefaultPayoutsCalculator>(
      DefaultPayoutsCalculator,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('calculate', () => {
    const reservedFunds = BigInt(faker.number.int({ min: 1000 }).toString());
    const mockedGetReservedFunds = jest
      .fn()
      .mockImplementation(async () => reservedFunds);

    beforeAll(() => {
      mockedEscrowClient.build.mockResolvedValue({
        getReservedFunds: mockedGetReservedFunds,
      } as unknown as EscrowClient);
    });

    it('should calculate equal payouts for accepted results', async () => {
      const acceptedResults = [
        generateFinalResult(VerificationResult.Accepted),
        generateFinalResult(VerificationResult.Accepted),
      ];
      const rejectedResult = generateFinalResult(VerificationResult.Rejected);
      const results = faker.helpers.shuffle([
        ...acceptedResults,
        rejectedResult,
      ]);
      const manifest: BaseManifest<MarketingJobType> = {
        jobType: MarketingJobType.SOCIAL_MEDIA_PROMOTION,
        submissionsRequired: faker.number.int({ min: 2, max: 5 }),
      };

      mockedStorageService.downloadJsonLikeData.mockResolvedValueOnce(results);

      const payouts = await calculator.calculate({
        chainId: generateTestnetChainId(),
        escrowAddress: faker.finance.ethereumAddress(),
        finalResultsUrl: faker.internet.url(),
        manifest,
      });

      const expectedPayouts = acceptedResults.map((result) => ({
        address: result.workerAddress,
        amount: reservedFunds / BigInt(manifest.submissionsRequired),
      }));

      expect(normalizePayouts(payouts)).toEqual(
        normalizePayouts(expectedPayouts),
      );
    });

    it('should return an empty list when there are no accepted results', async () => {
      mockedStorageService.downloadJsonLikeData.mockResolvedValueOnce([
        generateFinalResult(VerificationResult.Rejected),
        generateFinalResult(VerificationResult.Rejected),
      ]);

      const payouts = await calculator.calculate({
        chainId: generateTestnetChainId(),
        escrowAddress: faker.finance.ethereumAddress(),
        finalResultsUrl: faker.internet.url(),
        manifest: {
          jobType: MarketingJobType.SOCIAL_MEDIA_PROMOTION,
          submissionsRequired: faker.number.int({ min: 2, max: 5 }),
        },
      });

      expect(payouts).toEqual([]);
    });
  });
});

function generateFinalResult(
  verificationResult: VerificationResult,
): BaseFinalResult {
  return {
    workerAddress: faker.finance.ethereumAddress(),
    verificationResult,
    ...(verificationResult === VerificationResult.Rejected
      ? { rejectionReason: faker.lorem.word() }
      : {}),
  };
}

function normalizePayouts(items: { address: string; amount: bigint }[]) {
  return items
    .map((item) => ({
      address: item.address.toLowerCase(),
      amount: item.amount.toString(),
    }))
    .sort((a, b) => a.address.localeCompare(b.address));
}
