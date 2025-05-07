jest.mock('../../common/utils/storage', () => ({
  ...jest.requireActual('../../common/utils/storage'),
  listObjectsInBucket: jest.fn(),
}));

/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { Encryption } from '@human-protocol/sdk';
import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ethers } from 'ethers';
import { AuthConfigService } from '../../common/config/auth-config.service';
import { CvatConfigService } from '../../common/config/cvat-config.service';
import { PGPConfigService } from '../../common/config/pgp-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ErrorJob } from '../../common/constants/errors';
import {
  AudinoJobType,
  CvatJobType,
  FortuneJobType,
  HCaptchaJobType,
  JobCaptchaMode,
  JobCaptchaRequestType,
  JobCaptchaShapeType,
} from '../../common/enums/job';
import { ControlledError } from '../../common/errors/controlled';
import {
  generateBucketUrl,
  listObjectsInBucket,
} from '../../common/utils/storage';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import {
  createJobAudinoDto,
  createJobCaptchaDto,
  createJobCvatDto,
  getMockedProvider,
  getMockedRegion,
  mockAuthConfigService,
  mockCvatConfigService,
  mockWeb3ConfigService,
} from './fixtures';
import { FortuneManifestDto } from './manifest.dto';
import { ManifestService } from './manifest.service';

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
          provide: AuthConfigService,
          useValue: mockAuthConfigService,
        },
        {
          provide: CvatConfigService,
          useValue: mockCvatConfigService,
        },
        { provide: PGPConfigService, useValue: { encrypt: false } },
        {
          provide: Web3ConfigService,
          useValue: mockWeb3ConfigService,
        },
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
        manifestService['calculateJobBounty'] = jest
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
            val_size: expect.any(Number),
            gt_url: expect.any(String),
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
            val_size: expect.any(Number),
            gt_url: expect.any(String),
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
            val_size: expect.any(Number),
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
            val_size: expect.any(Number),
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
        ).rejects.toThrow(
          new ControlledError(ErrorJob.DataNotExist, HttpStatus.CONFLICT),
        );
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
        ).rejects.toThrow(
          new ControlledError(ErrorJob.DataNotExist, HttpStatus.CONFLICT),
        );
      });
    });

    describe('createAudinoManifest', () => {
      it('should create an Audino manifest successfully', async () => {
        const mockDto = createJobAudinoDto(); // Use the helper function
        const mockRequestType = AudinoJobType.AUDIO_TRANSCRIPTION;
        const mockTokenFundAmount = faker.number.int({ min: 1, max: 1000 });
        const mockTokenFundDecimals = faker.number.int({ min: 1, max: 18 });

        const result = await manifestService.createManifest(
          mockDto as any,
          mockRequestType,
          mockTokenFundAmount,
          mockTokenFundDecimals,
        );

        const totalSegments = Math.ceil(
          (mockDto.audioDuration * 1000) / mockDto.segmentDuration,
        );
        const jobBounty =
          ethers.parseUnits(mockTokenFundAmount.toString(), 'ether') /
          BigInt(totalSegments);

        expect(result).toEqual({
          annotation: {
            description: mockDto.requesterDescription,
            labels: mockDto.labels,
            qualifications: mockDto.qualifications || [],
            type: mockRequestType,
            user_guide: mockDto.userGuide,
            segment_duration: mockDto.segmentDuration,
          },
          data: {
            data_url: generateBucketUrl(mockDto.data.dataset, mockRequestType)
              .href,
          },
          job_bounty: ethers.formatEther(jobBounty),
          validation: {
            gt_url: generateBucketUrl(mockDto.groundTruth, mockRequestType)
              .href,
            min_quality: mockDto.minQuality,
          },
        });
      });
    });

    describe('createHCaptchaManifest', () => {
      const requestType = HCaptchaJobType.HCAPTCHA;
      const tokenFundAmount = faker.number.int({ min: 1, max: 1000 });
      const tokenFundDecimals = faker.number.int({ min: 1, max: 18 });

      beforeEach(() => {
        const fileContent = JSON.stringify({
          [faker.internet.url()]: [true, true, true],
        });
        (listObjectsInBucket as jest.Mock).mockResolvedValueOnce([
          `${faker.word.sample()}.jpg`,
          `${faker.word.sample()}.jpg`,
          `${faker.word.sample()}.jpg`,
        ]);
        mockStorageService.uploadJsonLikeData.mockResolvedValueOnce({
          url: faker.internet.url(),
          hash: faker.string.uuid(),
        });
        mockStorageService.downloadJsonLikeData.mockResolvedValueOnce(
          fileContent,
        );
      });

      it('should create a valid HCaptcha manifest for COMPARISON job type', async () => {
        const jobDto = createJobCaptchaDto({
          annotations: {
            typeOfJob: JobCaptchaShapeType.COMPARISON,
            labelingPrompt: faker.lorem.sentence(),
            groundTruths: faker.internet.url(),
            taskBidPrice: faker.number.float({ min: 0.1, max: 10 }),
            exampleImages: [faker.internet.url(), faker.internet.url()],
          },
        });

        const result = await manifestService.createManifest(
          jobDto,
          requestType,
          tokenFundAmount,
          tokenFundDecimals,
        );

        expect(result).toEqual({
          job_mode: JobCaptchaMode.BATCH,
          requester_accuracy_target: jobDto.accuracyTarget,
          request_config: expect.any(Object),
          restricted_audience: expect.any(Object),
          requester_max_repeats: jobDto.maxRequests,
          requester_min_repeats: jobDto.minRequests,
          requester_question: { en: jobDto.annotations.labelingPrompt },
          job_total_tasks: expect.any(Number),
          task_bid_price: jobDto.annotations.taskBidPrice,
          taskdata_uri: expect.any(String),
          public_results: true,
          oracle_stake: expect.any(Number),
          repo_uri: expect.any(String),
          ro_uri: expect.any(String),
          request_type: expect.any(String),
          groundtruth_uri: expect.any(String),
          requester_restricted_answer_set: expect.any(Object),
          requester_question_example: jobDto.annotations.exampleImages,
        });
      });

      it('should create a valid HCaptcha manifest for CATEGORIZATION job type', async () => {
        const jobDto = createJobCaptchaDto({
          annotations: {
            typeOfJob: JobCaptchaShapeType.CATEGORIZATION,
            labelingPrompt: faker.lorem.sentence(),
            groundTruths: faker.internet.url(),
            taskBidPrice: faker.number.float({ min: 0.1, max: 10 }),
          },
        });

        const result = await manifestService.createManifest(
          jobDto,
          requestType,
          tokenFundAmount,
          tokenFundDecimals,
        );

        expect(result).toEqual({
          job_mode: JobCaptchaMode.BATCH,
          requester_accuracy_target: jobDto.accuracyTarget,
          request_config: expect.any(Object),
          restricted_audience: expect.any(Object),
          requester_max_repeats: jobDto.maxRequests,
          requester_min_repeats: jobDto.minRequests,
          requester_question: { en: jobDto.annotations.labelingPrompt },
          job_total_tasks: expect.any(Number),
          task_bid_price: jobDto.annotations.taskBidPrice,
          taskdata_uri: expect.any(String),
          public_results: true,
          oracle_stake: expect.any(Number),
          repo_uri: expect.any(String),
          ro_uri: expect.any(String),
          request_type: expect.any(String),
          groundtruth_uri: expect.any(String),
          requester_restricted_answer_set: expect.any(Object),
        });
      });

      it('should create a valid HCaptcha manifest for POLYGON job type', async () => {
        const jobDto = createJobCaptchaDto({
          annotations: {
            typeOfJob: JobCaptchaShapeType.POLYGON,
            labelingPrompt: faker.lorem.sentence(),
            taskBidPrice: faker.number.float({ min: 0.1, max: 10 }),
            groundTruths: faker.internet.url(),
            label: faker.lorem.word(),
          },
        });

        const result = await manifestService.createManifest(
          jobDto,
          requestType,
          tokenFundAmount,
          tokenFundDecimals,
        );

        expect(result).toEqual({
          job_mode: JobCaptchaMode.BATCH,
          requester_accuracy_target: jobDto.accuracyTarget,
          request_config: {
            shape_type: JobCaptchaShapeType.POLYGON,
            min_shapes_per_image: expect.any(Number),
            max_shapes_per_image: expect.any(Number),
            min_points: expect.any(Number),
            max_points: expect.any(Number),
            minimum_selection_area_per_shape: expect.any(Number),
          },
          restricted_audience: {
            sitekey: [expect.any(Object)],
          },
          requester_max_repeats: jobDto.maxRequests,
          requester_min_repeats: jobDto.minRequests,
          requester_question: { en: jobDto.annotations.labelingPrompt },
          requester_question_example: [],
          job_total_tasks: expect.any(Number),
          task_bid_price: jobDto.annotations.taskBidPrice,
          taskdata_uri: expect.any(String),
          public_results: true,
          oracle_stake: expect.any(Number),
          repo_uri: expect.any(String),
          ro_uri: expect.any(String),
          request_type: JobCaptchaRequestType.IMAGE_LABEL_AREA_SELECT,
          groundtruth_uri: jobDto.annotations.groundTruths,
          requester_restricted_answer_set: {
            [jobDto.annotations.label!]: { en: jobDto.annotations.label },
          },
        });
      });

      it('should throw ControlledError for invalid POLYGON job type without label', async () => {
        const jobDto = createJobCaptchaDto({
          annotations: {
            typeOfJob: JobCaptchaShapeType.POLYGON,
            labelingPrompt: faker.lorem.sentence(),
            taskBidPrice: faker.number.float({ min: 0.1, max: 10 }),
            groundTruths: faker.internet.url(),
          },
        });

        await expect(
          manifestService.createManifest(
            jobDto,
            requestType,
            tokenFundAmount,
            tokenFundDecimals,
          ),
        ).rejects.toThrow(
          new ControlledError(
            ErrorJob.JobParamsValidationFailed,
            HttpStatus.BAD_REQUEST,
          ),
        );
      });

      it('should create a valid HCaptcha manifest for POINT job type', async () => {
        const jobDto = createJobCaptchaDto({
          annotations: {
            typeOfJob: JobCaptchaShapeType.POINT,
            labelingPrompt: faker.lorem.sentence(),
            taskBidPrice: faker.number.float({ min: 0.1, max: 10 }),
            groundTruths: faker.internet.url(),
            label: faker.lorem.word(),
          },
        });

        const result = await manifestService.createManifest(
          jobDto,
          requestType,
          tokenFundAmount,
          tokenFundDecimals,
        );

        expect(result).toEqual({
          job_mode: JobCaptchaMode.BATCH,
          requester_accuracy_target: jobDto.accuracyTarget,
          request_config: {
            shape_type: JobCaptchaShapeType.POINT,
            min_shapes_per_image: expect.any(Number),
            max_shapes_per_image: expect.any(Number),
            min_points: expect.any(Number),
            max_points: expect.any(Number),
          },
          restricted_audience: {
            sitekey: [expect.any(Object)],
          },
          requester_max_repeats: jobDto.maxRequests,
          requester_min_repeats: jobDto.minRequests,
          requester_question: { en: jobDto.annotations.labelingPrompt },
          requester_question_example: jobDto.annotations.exampleImages || [],
          job_total_tasks: expect.any(Number),
          task_bid_price: jobDto.annotations.taskBidPrice,
          taskdata_uri: expect.any(String),
          public_results: true,
          oracle_stake: expect.any(Number),
          repo_uri: expect.any(String),
          ro_uri: expect.any(String),
          request_type: JobCaptchaRequestType.IMAGE_LABEL_AREA_SELECT,
          groundtruth_uri: jobDto.annotations.groundTruths,
          requester_restricted_answer_set: {
            [jobDto.annotations.label!]: { en: jobDto.annotations.label },
          },
        });
      });

      it('should throw ControlledError for invalid POINT job type without label', async () => {
        const jobDto = createJobCaptchaDto({
          annotations: {
            typeOfJob: JobCaptchaShapeType.POINT,
            labelingPrompt: faker.lorem.sentence(),
            taskBidPrice: faker.number.float({ min: 0.1, max: 10 }),
            groundTruths: faker.internet.url(),
          },
        });

        await expect(
          manifestService.createManifest(
            jobDto,
            requestType,
            tokenFundAmount,
            tokenFundDecimals,
          ),
        ).rejects.toThrow(
          new ControlledError(
            ErrorJob.JobParamsValidationFailed,
            HttpStatus.BAD_REQUEST,
          ),
        );
      });

      it('should create a valid HCaptcha manifest for BOUNDING_BOX job type', async () => {
        const jobDto = createJobCaptchaDto({
          annotations: {
            typeOfJob: JobCaptchaShapeType.BOUNDING_BOX,
            labelingPrompt: faker.lorem.sentence(),
            taskBidPrice: faker.number.float({ min: 0.1, max: 10 }),
            groundTruths: faker.internet.url(),
            label: faker.lorem.word(),
          },
        });

        const result = await manifestService.createManifest(
          jobDto,
          requestType,
          tokenFundAmount,
          tokenFundDecimals,
        );

        expect(result).toEqual({
          job_mode: JobCaptchaMode.BATCH,
          requester_accuracy_target: jobDto.accuracyTarget,
          request_config: {
            shape_type: JobCaptchaShapeType.BOUNDING_BOX,
            min_shapes_per_image: expect.any(Number),
            max_shapes_per_image: expect.any(Number),
            min_points: expect.any(Number),
            max_points: expect.any(Number),
          },
          restricted_audience: {
            sitekey: [expect.any(Object)],
          },
          requester_max_repeats: jobDto.maxRequests,
          requester_min_repeats: jobDto.minRequests,
          requester_question: { en: jobDto.annotations.labelingPrompt },
          requester_question_example: jobDto.annotations.exampleImages || [],
          job_total_tasks: expect.any(Number),
          task_bid_price: jobDto.annotations.taskBidPrice,
          taskdata_uri: expect.any(String),
          public_results: true,
          oracle_stake: expect.any(Number),
          repo_uri: expect.any(String),
          ro_uri: expect.any(String),
          request_type: JobCaptchaRequestType.IMAGE_LABEL_AREA_SELECT,
          groundtruth_uri: jobDto.annotations.groundTruths,
          requester_restricted_answer_set: {
            [jobDto.annotations.label!]: { en: jobDto.annotations.label },
          },
        });
      });

      it('should throw ControlledError for invalid BOUNDING_BOX job type without label', async () => {
        const jobDto = createJobCaptchaDto({
          annotations: {
            typeOfJob: JobCaptchaShapeType.BOUNDING_BOX,
            labelingPrompt: faker.lorem.sentence(),
            taskBidPrice: faker.number.float({ min: 0.1, max: 10 }),
            groundTruths: faker.internet.url(),
          },
        });

        await expect(
          manifestService.createManifest(
            jobDto,
            requestType,
            tokenFundAmount,
            tokenFundDecimals,
          ),
        ).rejects.toThrow(
          new ControlledError(
            ErrorJob.JobParamsValidationFailed,
            HttpStatus.BAD_REQUEST,
          ),
        );
      });

      it('should create a valid HCaptcha manifest for IMMO job type', async () => {
        const jobDto = createJobCaptchaDto({
          annotations: {
            typeOfJob: JobCaptchaShapeType.IMMO,
            labelingPrompt: faker.lorem.sentence(),
            taskBidPrice: faker.number.float({ min: 0.1, max: 10 }),
            groundTruths: faker.internet.url(),
            label: faker.lorem.word(),
          },
        });

        const result = await manifestService.createManifest(
          jobDto,
          requestType,
          tokenFundAmount,
          tokenFundDecimals,
        );

        expect(result).toEqual({
          job_mode: JobCaptchaMode.BATCH,
          requester_accuracy_target: jobDto.accuracyTarget,
          request_config: {
            multiple_choice_max_choices: 1,
            multiple_choice_min_choices: 1,
            overlap_threshold: null,
            answer_type: 'str',
            max_length: expect.any(Number),
            min_length: expect.any(Number),
          },
          restricted_audience: {
            sitekey: [expect.any(Object)],
          },
          requester_max_repeats: jobDto.maxRequests,
          requester_min_repeats: jobDto.minRequests,
          requester_question: { en: jobDto.annotations.labelingPrompt },
          job_total_tasks: expect.any(Number),
          task_bid_price: jobDto.annotations.taskBidPrice,
          taskdata: [],
          taskdata_uri: expect.any(String),
          public_results: true,
          oracle_stake: expect.any(Number),
          repo_uri: expect.any(String),
          ro_uri: expect.any(String),
          request_type: JobCaptchaRequestType.TEXT_FREEE_NTRY,
          requester_restricted_answer_set: {
            [jobDto.annotations.label!]: { en: jobDto.annotations.label },
          },
        });
      });

      it('should throw ControlledError for invalid IMMO job type without label', async () => {
        const jobDto = createJobCaptchaDto({
          annotations: {
            typeOfJob: JobCaptchaShapeType.IMMO,
            labelingPrompt: faker.lorem.sentence(),
            taskBidPrice: faker.number.float({ min: 0.1, max: 10 }),
            groundTruths: faker.internet.url(),
          },
        });

        await expect(
          manifestService.createManifest(
            jobDto,
            requestType,
            tokenFundAmount,
            tokenFundDecimals,
          ),
        ).rejects.toThrow(
          new ControlledError(
            ErrorJob.JobParamsValidationFailed,
            HttpStatus.BAD_REQUEST,
          ),
        );
      });

      it('should throw ControlledError for invalid job type', async () => {
        const jobDto = createJobCaptchaDto({
          annotations: {
            typeOfJob: 'INVALID_JOB_TYPE' as JobCaptchaShapeType,
            labelingPrompt: faker.lorem.sentence(),
            taskBidPrice: faker.number.float({ min: 0.1, max: 10 }),
            groundTruths: faker.internet.url(),
          },
        });

        await expect(
          manifestService.createManifest(
            jobDto,
            requestType,
            tokenFundAmount,
            tokenFundDecimals,
          ),
        ).rejects.toThrow(
          new ControlledError(
            ErrorJob.HCaptchaInvalidJobType,
            HttpStatus.CONFLICT,
          ),
        );
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
        new ControlledError('File not uploaded', HttpStatus.BAD_REQUEST),
      );

      await expect(
        manifestService.uploadManifest(
          mockChainId,
          mockData,
          mockOracleAddresses,
        ),
      ).rejects.toThrow(ControlledError);
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
      ).rejects.toThrow(ControlledError);
    });
  });
});
