jest.mock('../../common/utils/storage', () => ({
  ...jest.requireActual('../../common/utils/storage'),
  listObjectsInBucket: jest.fn(),
}));

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { Encryption } from '@human-protocol/sdk';
import { Test } from '@nestjs/testing';
import { CvatConfigService } from '../../common/config/cvat-config.service';
import { PGPConfigService } from '../../common/config/pgp-config.service';
import { ErrorJob } from '../../common/constants/errors';
import { CvatJobType, FortuneJobType } from '../../common/enums/job';
import {
  ConflictError,
  ServerError,
  ValidationError,
} from '../../common/errors';
import { generateBucketUrl } from '../../common/utils/storage';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import { createJobCvatDto, mockCvatConfigService } from './fixtures';
import { FortuneManifestDto } from './manifest.dto';
import { ManifestService } from './manifest.service';
import {
  getMockedProvider,
  getMockedRegion,
} from '../../../test/fixtures/storage';

describe('ManifestService', () => {
  let manifestService: ManifestService;
  const mockStorageService = {
    uploadJsonLikeData: jest.fn(),
    downloadJsonLikeData: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ManifestService,
        { provide: Web3Service, useValue: createMock<Web3Service>() },
        { provide: StorageService, useValue: mockStorageService },
        {
          provide: CvatConfigService,
          useValue: mockCvatConfigService,
        },
        { provide: PGPConfigService, useValue: { encrypt: false } },
        { provide: Encryption, useValue: createMock<Encryption>() },
      ],
    }).compile();

    manifestService = moduleRef.get<ManifestService>(ManifestService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createManifest', () => {
    describe('createCvatManifest', () => {
      const tokenFundAmount = faker.number.int({ min: 1, max: 1000 });
      const tokenFundDecimals = faker.number.int({ min: 1, max: 18 });
      let jobBounty: string;

      beforeAll(() => {
        jobBounty = faker.number.int({ min: 1, max: 1000 }).toString();
        manifestService['calculateCvatJobBounty'] = jest
          .fn()
          .mockResolvedValue(jobBounty);
      });

      it('should create a valid CVAT manifest for image boxes job type', async () => {
        const dto = createJobCvatDto({ type: CvatJobType.IMAGE_BOXES });
        const requestType = CvatJobType.IMAGE_BOXES;

        const result = await manifestService.createManifest(
          dto,
          requestType,
          tokenFundAmount,
          tokenFundDecimals,
        );

        expect(result).toEqual({
          data: {
            data_url: generateBucketUrl(dto.data.dataset, requestType).href,
          },
          annotation: {
            labels: dto.labels,
            description: dto.requesterDescription,
            user_guide: dto.userGuide,
            type: requestType,
            job_size: mockCvatConfigService.jobSize,
          },
          validation: {
            min_quality: dto.minQuality,
            val_size: mockCvatConfigService.valSize,
            gt_url: generateBucketUrl(dto.groundTruth, requestType).href,
          },
          job_bounty: jobBounty,
        });
      });

      it('should create a valid CVAT manifest for image polygons job type', async () => {
        const dto = createJobCvatDto({ type: CvatJobType.IMAGE_POLYGONS });
        const requestType = CvatJobType.IMAGE_POLYGONS;

        const result = await manifestService.createManifest(
          dto,
          requestType,
          tokenFundAmount,
          tokenFundDecimals,
        );

        expect(result).toEqual({
          data: {
            data_url: generateBucketUrl(dto.data.dataset, requestType).href,
          },
          annotation: {
            labels: dto.labels,
            description: dto.requesterDescription,
            user_guide: dto.userGuide,
            type: requestType,
            job_size: mockCvatConfigService.jobSize,
          },
          validation: {
            min_quality: dto.minQuality,
            val_size: mockCvatConfigService.valSize,
            gt_url: generateBucketUrl(dto.groundTruth, requestType).href,
          },
          job_bounty: jobBounty,
        });
      });

      it('should create a valid CVAT manifest for image boxes from points job type', async () => {
        const dto = createJobCvatDto({
          data: {
            dataset: {
              provider: getMockedProvider(),
              region: getMockedRegion(),
              bucketName: faker.lorem.word(),
              path: faker.system.filePath(),
            },
            points: {
              provider: getMockedProvider(),
              region: getMockedRegion(),
              bucketName: faker.lorem.word(),
              path: faker.system.filePath(),
            },
          },
          type: CvatJobType.IMAGE_BOXES_FROM_POINTS,
        });
        const requestType = CvatJobType.IMAGE_BOXES_FROM_POINTS;

        const result = await manifestService.createManifest(
          dto,
          requestType,
          tokenFundAmount,
          tokenFundDecimals,
        );

        expect(result).toEqual({
          data: {
            data_url: generateBucketUrl(dto.data.dataset, requestType).href,
            points_url: generateBucketUrl(dto.data.points!, requestType).href,
          },
          annotation: {
            labels: dto.labels,
            description: dto.requesterDescription,
            user_guide: dto.userGuide,
            type: requestType,
            job_size: mockCvatConfigService.jobSize,
          },
          validation: {
            min_quality: dto.minQuality,
            val_size: mockCvatConfigService.valSize,
            gt_url: generateBucketUrl(dto.groundTruth, requestType).href,
          },
          job_bounty: jobBounty,
        });
      });

      it('should create a valid CVAT manifest for image skeletons from boxes job type', async () => {
        const dto = createJobCvatDto({
          data: {
            dataset: {
              provider: getMockedProvider(),
              region: getMockedRegion(),
              bucketName: faker.lorem.word(),
              path: faker.system.filePath(),
            },
            boxes: {
              provider: getMockedProvider(),
              region: getMockedRegion(),
              bucketName: faker.lorem.word(),
              path: faker.system.filePath(),
            },
          },
          type: CvatJobType.IMAGE_SKELETONS_FROM_BOXES,
        });
        const requestType = CvatJobType.IMAGE_SKELETONS_FROM_BOXES;

        const result = await manifestService.createManifest(
          dto,
          requestType,
          tokenFundAmount,
          tokenFundDecimals,
        );

        expect(result).toEqual({
          data: {
            data_url: generateBucketUrl(dto.data.dataset, requestType).href,
            boxes_url: generateBucketUrl(dto.data.boxes!, requestType).href,
          },
          annotation: {
            labels: dto.labels,
            description: dto.requesterDescription,
            user_guide: dto.userGuide,
            type: requestType,
            job_size: mockCvatConfigService.jobSize,
          },
          validation: {
            min_quality: dto.minQuality,
            val_size: mockCvatConfigService.valSize,
            gt_url: generateBucketUrl(dto.groundTruth, requestType).href,
          },
          job_bounty: jobBounty,
        });
      });

      it('should throw an error if data does not exist for image boxes from points job type', async () => {
        const requestType = CvatJobType.IMAGE_BOXES_FROM_POINTS;

        const dto = createJobCvatDto({ type: requestType });

        await expect(
          manifestService.createManifest(
            dto,
            requestType,
            tokenFundAmount,
            tokenFundDecimals,
          ),
        ).rejects.toThrow(new ConflictError(ErrorJob.DataNotExist));
      });

      it('should throw an error if data does not exist for image skeletons from boxes job type', async () => {
        const requestType = CvatJobType.IMAGE_SKELETONS_FROM_BOXES;

        const dto = createJobCvatDto({ type: requestType });

        await expect(
          manifestService.createManifest(
            dto,
            requestType,
            tokenFundAmount,
            tokenFundDecimals,
          ),
        ).rejects.toThrow(new ConflictError(ErrorJob.DataNotExist));
      });
    });
  });

  describe('uploadManifest', () => {
    it('should upload a manifest successfully', async () => {
      const mockChainId = faker.number.int();
      const mockData = { key: faker.lorem.word() };
      const mockOracleAddresses: string[] = [];
      const mockManifestData = {
        url: faker.internet.url(),
        hash: faker.string.uuid(),
      };

      mockStorageService.uploadJsonLikeData.mockResolvedValueOnce(
        mockManifestData,
      );

      const result = await manifestService.uploadManifest(
        mockChainId,
        mockData,
        mockOracleAddresses,
      );

      expect(result).toEqual(
        expect.objectContaining({
          url: mockManifestData.url,
          hash: mockManifestData.hash,
        }),
      );
    });

    it('should throw an error if upload fails', async () => {
      const mockChainId = faker.number.int();
      const mockData = { key: faker.lorem.word() };
      const mockOracleAddresses: string[] = [];

      mockStorageService.uploadJsonLikeData.mockRejectedValue(
        new ServerError('File not uploaded'),
      );

      await expect(
        manifestService.uploadManifest(
          mockChainId,
          mockData,
          mockOracleAddresses,
        ),
      ).rejects.toThrow(ServerError);
    });
  });

  describe('downloadManifest', () => {
    it('should download and validate a manifest successfully', async () => {
      const mockManifestUrl = faker.internet.url();
      const mockRequestType = FortuneJobType.FORTUNE;
      const mockManifest: FortuneManifestDto = {
        submissionsRequired: faker.number.int({ min: 1, max: 100 }),
        requesterTitle: faker.lorem.words(3),
        requesterDescription: faker.lorem.sentence(),
        fundAmount: faker.number.float({ min: 1, max: 1000 }),
        requestType: FortuneJobType.FORTUNE,
        qualifications: [faker.lorem.word(), faker.lorem.word()],
      };
      mockStorageService.downloadJsonLikeData.mockResolvedValueOnce(
        mockManifest,
      );
      const result = await manifestService.downloadManifest(
        mockManifestUrl,
        mockRequestType,
      );
      expect(result).toEqual(mockManifest);
    });

    it('should throw an error if validation fails', async () => {
      const mockManifestUrl = faker.internet.url();
      const mockRequestType = CvatJobType.IMAGE_BOXES;
      const mockManifest: FortuneManifestDto = {
        submissionsRequired: faker.number.int({ min: 1, max: 100 }),
        requesterTitle: faker.lorem.words(3),
        requesterDescription: faker.lorem.sentence(),
        fundAmount: faker.number.float({ min: 1, max: 1000 }),
        requestType: FortuneJobType.FORTUNE,
        qualifications: [faker.lorem.word(), faker.lorem.word()],
      };
      mockStorageService.downloadJsonLikeData.mockResolvedValueOnce(
        mockManifest,
      );
      await expect(
        manifestService.downloadManifest(mockManifestUrl, mockRequestType),
      ).rejects.toThrow(new ValidationError(ErrorJob.ManifestValidationFailed));
    });
  });
});
