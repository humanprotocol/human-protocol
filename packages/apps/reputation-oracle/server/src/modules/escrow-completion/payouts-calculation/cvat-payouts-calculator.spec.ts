jest.mock('@human-protocol/sdk');

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { EscrowClient } from '@human-protocol/sdk';
import { Test } from '@nestjs/testing';
import _ from 'lodash';

import { CvatAnnotationMeta } from '@/common/types';
import { StorageService } from '@/modules/storage';
import { Web3Service } from '@/modules/web3';
import { generateTestnetChainId } from '@/modules/web3/fixtures';

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
    const mockedGetReservedFunds = jest
      .fn()
      .mockImplementation(async () =>
        BigInt(faker.number.int({ min: 1000, max: 100000 })),
      );

    beforeAll(() => {
      mockedEscrowClient.build.mockResolvedValue({
        getIntermediateResultsUrl: mockedGetIntermediateResultsUrl,
        getReservedFunds: mockedGetReservedFunds,
      } as unknown as EscrowClient);
    });

    afterEach(() => {
      jest.resetAllMocks();
      mockedEscrowClient.build.mockResolvedValue({
        getIntermediateResultsUrl: mockedGetIntermediateResultsUrl,
        getReservedFunds: mockedGetReservedFunds,
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
      const jobCount = jobsPerAnnotator * annotators.length;
      const payoutPerJob = BigInt(faker.number.int({ min: 1000, max: 100000 }));
      const reservedFunds = payoutPerJob * BigInt(jobCount);

      const annotationsMeta: CvatAnnotationMeta = {
        jobs: Array.from({ length: jobCount }, (_v, index: number) => ({
          job_id: index,
          final_result_id: faker.number.int(),
        })),
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

      mockedGetReservedFunds.mockResolvedValueOnce(reservedFunds);
      const manifest = generateCvatManifest();
      const payouts = await calculator.calculate({
        chainId,
        escrowAddress,
        manifest: manifest,
        finalResultsUrl: faker.internet.url(),
      });

      const expectedJobBounty = payoutPerJob;
      const expectedAmountPerAnnotator =
        BigInt(jobsPerAnnotator) * expectedJobBounty;

      const expectedPayouts = annotators.map((address) => ({
        address,
        amount: expectedAmountPerAnnotator,
      }));

      expect(_.sortBy(payouts, 'address')).toEqual(
        _.sortBy(expectedPayouts, 'address'),
      );
    });

    it('should properly calculate workers bounties', async () => {
      const annotators = [
        faker.finance.ethereumAddress(),
        faker.finance.ethereumAddress(),
      ];

      const jobsPerAnnotator = faker.number.int({ min: 1, max: 3 });
      const reservedFunds = BigInt(
        faker.number.int({ min: 1000, max: 100000 }).toString(),
      );

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
      mockedGetReservedFunds.mockResolvedValueOnce(reservedFunds);

      const manifest = generateCvatManifest();

      const payouts = await calculator.calculate({
        chainId,
        escrowAddress,
        manifest,
        finalResultsUrl: faker.internet.url(),
      });

      const matchedJobCount = annotationsMeta.jobs.filter((job) =>
        annotationsMeta.results.some(
          (result) => result.id === job.final_result_id,
        ),
      ).length;
      const expectedJobBounty = reservedFunds / BigInt(matchedJobCount);
      const expectedAmountPerAnnotator =
        BigInt(jobsPerAnnotator) * expectedJobBounty;

      const expectedPayouts = annotators.map((address) => ({
        address,
        amount: expectedAmountPerAnnotator,
      }));

      expect(_.sortBy(payouts, 'address')).toEqual(
        _.sortBy(expectedPayouts, 'address'),
      );
    });

    it('throws when there are no jobs with matching final results', async () => {
      mockedStorageService.downloadJsonLikeData.mockResolvedValueOnce({
        jobs: [
          {
            job_id: faker.number.int(),
            final_result_id: faker.number.int(),
          },
        ],
        results: [
          {
            id: faker.number.int(),
            job_id: faker.number.int(),
            annotator_wallet_address: faker.finance.ethereumAddress(),
            annotation_quality: faker.number.float(),
          },
        ],
      } as CvatAnnotationMeta);

      await expect(
        calculator.calculate({
          chainId,
          escrowAddress,
          manifest: generateCvatManifest(),
          finalResultsUrl: faker.internet.url(),
        }),
      ).rejects.toThrow('Invalid annotation meta');
    });
  });
});
