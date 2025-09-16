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

      const tokenDecimals = faker.number.int({ min: 6, max: 18 });
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

      expect(_.sortBy(payouts, 'address')).toEqual(
        _.sortBy(expectedPayouts, 'address'),
      );

      expect(mockedStorageService.downloadJsonLikeData).toHaveBeenCalledWith(
        resultsUrl,
      );
    });
  });
});
