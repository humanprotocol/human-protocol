import { createMock } from '@golevelup/ts-jest';
import { faker } from '@faker-js/faker';
import { Test } from '@nestjs/testing';
import { ethers } from 'ethers';
import _ from 'lodash';

import { StorageService } from '../../storage/storage.service';

import { generateFortuneManifest, generateFortuneSolution } from '../fixtures';
import { FortunePayoutsCalculator } from './fortune-payouts-calculator';

const mockedStorageService = createMock<StorageService>();

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
      ],
    }).compile();

    calculator = moduleRef.get<FortunePayoutsCalculator>(
      FortunePayoutsCalculator,
    );
  });

  describe('calculate', () => {
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
      const resultsUrl = faker.internet.url();
      mockedStorageService.downloadJsonLikeData.mockImplementationOnce(
        async (url) => {
          if (url === resultsUrl) {
            return results;
          }
          throw new Error('Results not found');
        },
      );
      const manifest = generateFortuneManifest();

      const payouts = await calculator.calculate({
        chainId: faker.number.int(),
        escrowAddress: faker.finance.ethereumAddress(),
        finalResultsUrl: resultsUrl,
        manifest,
      });

      const expectedPayouts = validSolutions.map((s) => ({
        address: s.workerAddress,
        amount:
          BigInt(ethers.parseUnits(manifest.fundAmount.toString(), 'ether')) /
          BigInt(validSolutions.length),
      }));

      expect(_.sortBy(payouts, 'address')).toEqual(
        _.sortBy(expectedPayouts, 'address'),
      );
    });
  });
});
