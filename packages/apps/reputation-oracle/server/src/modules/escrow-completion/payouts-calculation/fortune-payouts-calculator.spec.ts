jest.mock('@human-protocol/sdk');

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { EscrowClient } from '@human-protocol/sdk';
import { Test } from '@nestjs/testing';

import { StorageService } from '@/modules/storage';
import { Web3Service } from '@/modules/web3';
import { generateTestnetChainId } from '@/modules/web3/fixtures';

import { generateFortuneManifest, generateFortuneSolution } from '../fixtures';
import { FortunePayoutsCalculator } from './fortune-payouts-calculator';

const mockedStorageService = createMock<StorageService>();
const mockedWeb3Service = createMock<Web3Service>();
const mockedEscrowClient = jest.mocked(EscrowClient);

describe('FortunePayoutsCalculator', () => {
  let calculator: FortunePayoutsCalculator;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        FortunePayoutsCalculator,
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

    calculator = moduleRef.get<FortunePayoutsCalculator>(
      FortunePayoutsCalculator,
    );

    const mockedGetTokenAddress = jest.fn().mockImplementation(async () => {
      return faker.finance.ethereumAddress();
    });
    mockedEscrowClient.build.mockResolvedValue({
      getTokenAddress: mockedGetTokenAddress,
    } as unknown as EscrowClient);
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
    it('should properly calculate payouts', async () => {
      const validSolutions = [
        generateFortuneSolution(),
        generateFortuneSolution(),
      ];
      const results = faker.helpers.shuffle([
        ...validSolutions,
        generateFortuneSolution('curse_word'),
        generateFortuneSolution('duplicated'),
        generateFortuneSolution(faker.string.sample()),
      ]);
      mockedStorageService.downloadJsonLikeData.mockResolvedValueOnce(results);
      const resultsUrl = faker.internet.url();
      const manifest = generateFortuneManifest();

      const tokenDecimals = BigInt(faker.number.int({ min: 6, max: 18 }));
      mockedWeb3Service.getTokenDecimals.mockResolvedValueOnce(tokenDecimals);

      const payouts = await calculator.calculate({
        chainId: generateTestnetChainId(),
        escrowAddress: faker.finance.ethereumAddress(),
        finalResultsUrl: resultsUrl,
        manifest,
      });

      const expectedPayouts = validSolutions.map((s) => ({
        address: s.workerAddress,
        amount: balance / BigInt(validSolutions.length),
      }));

      const normalize = (arr: { address: string; amount: bigint }[]) =>
        arr
          .map((p) => ({
            address: p.address.toLowerCase(),
            amount: p.amount.toString(),
          }))
          .sort((a, b) => a.address.localeCompare(b.address));

      expect(normalize(payouts)).toEqual(normalize(expectedPayouts));

      expect(mockedStorageService.downloadJsonLikeData).toHaveBeenCalledWith(
        resultsUrl,
      );
    });
  });
});
