jest.mock('@human-protocol/sdk');

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { EscrowClient } from '@human-protocol/sdk';
import { Test } from '@nestjs/testing';

import { VerificationResult } from '@/common/types';
import { StorageService } from '@/modules/storage';
import { Web3Service } from '@/modules/web3';
import { generateTestnetChainId } from '@/modules/web3/fixtures';

import {
  generateMarketingManifest,
  generateMarketingResult,
} from '../fixtures';
import { MarketingPayoutsCalculator } from './marketing-payouts-calculator';

const mockedStorageService = createMock<StorageService>();
const mockedWeb3Service = createMock<Web3Service>();
const mockedEscrowClient = jest.mocked(EscrowClient);

describe('MarketingPayoutsCalculator', () => {
  let calculator: MarketingPayoutsCalculator;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        MarketingPayoutsCalculator,
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

    calculator = moduleRef.get<MarketingPayoutsCalculator>(
      MarketingPayoutsCalculator,
    );
  });

  describe('calculate', () => {
    const balance = BigInt(faker.number.int({ min: 1000 }).toString());
    const mockedGetReservedFunds = jest
      .fn()
      .mockImplementation(async () => balance);

    beforeAll(() => {
      mockedEscrowClient.build.mockResolvedValue({
        getReservedFunds: mockedGetReservedFunds,
      } as unknown as EscrowClient);
    });

    it('should properly calculate payouts for accepted results only', async () => {
      const acceptedResults = [
        generateMarketingResult(VerificationResult.Accepted),
        generateMarketingResult(VerificationResult.Accepted),
      ];
      mockedStorageService.downloadJsonLikeData.mockResolvedValueOnce(
        faker.helpers.shuffle([
          ...acceptedResults,
          generateMarketingResult(VerificationResult.Rejected),
        ]),
      );

      const manifest = generateMarketingManifest();
      const payouts = await calculator.calculate({
        chainId: generateTestnetChainId(),
        escrowAddress: faker.finance.ethereumAddress(),
        finalResultsUrl: faker.internet.url(),
        manifest: manifest,
      });

      const expectedPayouts = acceptedResults.map((result) => ({
        address: result.workerAddress,
        amount: balance / BigInt(manifest.submissions_required),
      }));

      const normalize = (items: { address: string; amount: bigint }[]) =>
        items
          .map((item) => ({
            address: item.address.toLowerCase(),
            amount: item.amount.toString(),
          }))
          .sort((a, b) => a.address.localeCompare(b.address));

      expect(normalize(payouts)).toEqual(normalize(expectedPayouts));
    });

    it('should return an empty list when there are no accepted results', async () => {
      mockedStorageService.downloadJsonLikeData.mockResolvedValueOnce([
        generateMarketingResult(VerificationResult.Rejected),
        generateMarketingResult(VerificationResult.Rejected),
      ]);

      const payouts = await calculator.calculate({
        chainId: generateTestnetChainId(),
        escrowAddress: faker.finance.ethereumAddress(),
        finalResultsUrl: faker.internet.url(),
        manifest: generateMarketingManifest(),
      });

      expect(payouts).toEqual([]);
    });
  });
});
