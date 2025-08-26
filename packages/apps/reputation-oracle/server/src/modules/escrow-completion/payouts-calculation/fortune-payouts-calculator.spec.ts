jest.mock('@human-protocol/sdk');

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { EscrowClient } from '@human-protocol/sdk';
import { Test } from '@nestjs/testing';
import _ from 'lodash';

import { StorageService } from '../../storage';
import { Web3Service } from '../../web3';
import { generateTestnetChainId } from '../../web3/fixtures';
import { generateFortuneManifest, generateFortuneSolution } from '../fixtures';
import { FortunePayoutsCalculator } from './fortune-payouts-calculator';

const mockedStorageService = createMock<StorageService>();
const mockedWeb3Service = createMock<Web3Service>();
const mockedEscrowClient = jest.mocked(EscrowClient);

const normalize = (list: { address: string; amount: bigint }[]) =>
  _.sortBy(
    list.map((p) => ({
      address: p.address.toLowerCase(),
      amount: p.amount.toString(),
    })),
    'address',
  );

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
  });

  describe('calculate', () => {
    const balance = BigInt(
      faker.number.int({ min: 1000, multipleOf: 2 }).toString(),
    );
    const jobLauncherAddress = faker.finance.ethereumAddress();

    const mockedGetReservedFunds = jest
      .fn()
      .mockImplementation(async () => balance);
    const mockedGetJobLauncherAddress = jest
      .fn()
      .mockImplementation(async () => jobLauncherAddress);

    beforeAll(() => {
      mockedEscrowClient.build.mockResolvedValue({
        getReservedFunds: mockedGetReservedFunds,
        getJobLauncherAddress: mockedGetJobLauncherAddress,
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

      expect(normalize(payouts)).toEqual(normalize(expectedPayouts));

      expect(mockedStorageService.downloadJsonLikeData).toHaveBeenCalledWith(
        resultsUrl,
      );
    });

    it('should calculate payouts with remainder (rest added as extra payout entry)', async () => {
      const resultsUrl = faker.internet.url();
      const validSolutions = [
        generateFortuneSolution(),
        generateFortuneSolution(),
        generateFortuneSolution(),
      ];

      mockedStorageService.downloadJsonLikeData.mockResolvedValueOnce(
        validSolutions,
      );

      const payouts = await calculator.calculate({
        chainId: generateTestnetChainId(),
        escrowAddress: faker.finance.ethereumAddress(),
        finalResultsUrl: resultsUrl,
        manifest: generateFortuneManifest(),
      });

      const expectedPayouts = [
        ...validSolutions.map((s) => ({
          address: s.workerAddress,
          amount: balance / BigInt(validSolutions.length),
        })),
        {
          address: jobLauncherAddress,
          amount: balance % BigInt(validSolutions.length),
        },
      ];

      expect(normalize(payouts)).toEqual(normalize(expectedPayouts));

      expect(mockedStorageService.downloadJsonLikeData).toHaveBeenCalledWith(
        resultsUrl,
      );
    });
  });
});
