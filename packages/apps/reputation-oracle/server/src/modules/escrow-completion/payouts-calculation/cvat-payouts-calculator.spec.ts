jest.mock('@human-protocol/sdk');

import { createMock } from '@golevelup/ts-jest';
import { faker } from '@faker-js/faker';
import { EscrowClient } from '@human-protocol/sdk';
import { Test } from '@nestjs/testing';
import { ethers } from 'ethers';
import _ from 'lodash';

import { CvatAnnotationMeta } from '../../../common/types';

import { StorageService } from '../../storage';
import { generateTestnetChainId } from '../../web3/fixtures';
import { Web3Service } from '../../web3';

import { CvatPayoutsCalculator } from './cvat-payouts-calculator';
import { generateCvatManifest } from '../fixtures';

const mockedStorageService = createMock<StorageService>();
const mockedWeb3Service = createMock<Web3Service>();

const mockedEscrowClient = jest.mocked(EscrowClient);

describe('CvatPayoutsCalculator', () => {
  let calculator: CvatPayoutsCalculator;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CvatPayoutsCalculator,
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

    calculator = moduleRef.get<CvatPayoutsCalculator>(CvatPayoutsCalculator);
  });

  describe('calculate', () => {
    const chainId = generateTestnetChainId();
    const escrowAddress = faker.finance.ethereumAddress();

    const mockedGetIntermediateResultsUrl = jest
      .fn()
      .mockImplementation(async () => faker.internet.url());

    beforeAll(() => {
      mockedEscrowClient.build.mockResolvedValue({
        getIntermediateResultsUrl: mockedGetIntermediateResultsUrl,
      } as unknown as EscrowClient);
    });

    it('throws when invalid annotation meta downloaded from valid url', async () => {
      const intermediateResultsUrl = faker.internet.url();
      mockedGetIntermediateResultsUrl.mockResolvedValueOnce(
        intermediateResultsUrl,
      );

      mockedStorageService.downloadJsonLikeData.mockResolvedValueOnce({
        jobs: [],
        results: [],
      } as CvatAnnotationMeta);

      await expect(
        calculator.calculate({
          finalResultsUrl: faker.internet.url(),
          chainId,
          escrowAddress,
          manifest: generateCvatManifest(),
        }),
      ).rejects.toThrow('Invalid annotation meta');

      expect(mockedStorageService.downloadJsonLikeData).toHaveBeenCalledWith(
        `${intermediateResultsUrl}/validation_meta.json`,
      );
    });

    it('should properly calculate workers bounties', async () => {
      const annotators = [
        faker.finance.ethereumAddress(),
        faker.finance.ethereumAddress(),
      ];

      const jobsPerAnnotator = faker.number.int({ min: 1, max: 3 });

      const annotationsMeta: CvatAnnotationMeta = {
        jobs: Array.from(
          { length: jobsPerAnnotator * annotators.length },
          (_v, index: number) => ({
            job_id: index,
            final_result_id: faker.number.int(),
          }),
        ),
        results: [],
      };
      for (const job of annotationsMeta.jobs) {
        const annotatorIndex = job.job_id % annotators.length;

        annotationsMeta.results.push({
          id: job.final_result_id,
          job_id: job.job_id,
          annotator_wallet_address: annotators[annotatorIndex],
          annotation_quality: faker.number.float(),
        });
      }

      // imitate weird case: job w/o result
      annotationsMeta.jobs.push({
        job_id: faker.number.int(),
        final_result_id: faker.number.int(),
      });
      // imitate weird case: result w/o job
      annotationsMeta.results.push({
        id: faker.number.int(),
        job_id: faker.number.int(),
        annotator_wallet_address: faker.helpers.arrayElement(annotators),
        annotation_quality: faker.number.float(),
      });

      mockedStorageService.downloadJsonLikeData.mockResolvedValueOnce(
        annotationsMeta,
      );

      const manifest = generateCvatManifest();

      const payouts = await calculator.calculate({
        chainId,
        escrowAddress,
        manifest,
        finalResultsUrl: faker.internet.url(),
      });

      const expectedAmountPerAnnotator =
        BigInt(jobsPerAnnotator) * ethers.parseUnits(manifest.job_bounty, 18);

      const expectedPayouts = annotators.map((address) => ({
        address,
        amount: expectedAmountPerAnnotator,
      }));

      expect(_.sortBy(payouts, 'address')).toEqual(
        _.sortBy(expectedPayouts, 'address'),
      );
    });
  });
});
