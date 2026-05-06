import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { Encryption } from '@human-protocol/sdk';
import { Test } from '@nestjs/testing';
import { PGPConfigService } from '../../common/config/pgp-config.service';
import { ErrorJob } from '../../common/constants/errors';
import {
  CvatJobType,
  FortuneJobType,
  HCaptchaJobType,
  JobCaptchaRequestType,
} from '../../common/enums/job';
import { ServerError, ValidationError } from '../../common/errors';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import { createMockCvatManifest, createMockFortuneManifest } from './fixtures';
import { ManifestDto } from './manifest.dto';
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
        { provide: PGPConfigService, useValue: { encrypt: false } },
        { provide: Encryption, useValue: createMock<Encryption>() },
      ],
    }).compile();

    manifestService = moduleRef.get<ManifestService>(ManifestService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateManifest', () => {
    it('should validate a fortune manifest successfully', async () => {
      await expect(
        manifestService.validateManifest(
          FortuneJobType.FORTUNE,
          createMockFortuneManifest(),
        ),
      ).resolves.toBeUndefined();
    });

    it('should validate a cvat manifest successfully', async () => {
      const manifest = createMockCvatManifest();
      manifest.annotation.type = CvatJobType.IMAGE_BOXES;

      await expect(
        manifestService.validateManifest(CvatJobType.IMAGE_BOXES, manifest),
      ).resolves.toBeUndefined();
    });

    it('should validate an hcaptcha manifest successfully', async () => {
      const manifest = {
        job_mode: faker.lorem.word(),
        request_type: JobCaptchaRequestType.IMAGE_LABEL_BINARY,
        request_config: {},
        requester_accuracy_target: faker.number.float({
          min: 0.5,
          max: 1,
          fractionDigits: 2,
        }),
        requester_max_repeats: faker.number.int({ min: 2, max: 10 }),
        requester_min_repeats: faker.number.int({ min: 1, max: 1 }),
        requester_question: { en: faker.lorem.sentence() },
        taskdata_uri: faker.internet.url(),
        job_total_tasks: faker.number.int({ min: 1, max: 100 }),
        task_bid_price: faker.number.int({ min: 1, max: 10 }),
        public_results: faker.datatype.boolean(),
        oracle_stake: faker.number.int({ min: 1, max: 10 }),
        repo_uri: faker.internet.url(),
        ro_uri: faker.internet.url(),
        restricted_audience: {},
        requester_restricted_answer_set: {},
      };

      await expect(
        manifestService.validateManifest(HCaptchaJobType.HCAPTCHA, manifest),
      ).resolves.toBeUndefined();
    });

    it('should throw when a required fortune property is missing', async () => {
      const manifest = createMockFortuneManifest();
      delete (manifest as Partial<typeof manifest>).requesterDescription;

      await expect(
        manifestService.validateManifest(FortuneJobType.FORTUNE, manifest),
      ).rejects.toThrow(new ValidationError(ErrorJob.ManifestValidationFailed));
    });

    it('should throw when a required cvat property is missing', async () => {
      const manifest = createMockCvatManifest();
      delete (manifest.validation as Partial<(typeof manifest)['validation']>)
        .gt_url;

      await expect(
        manifestService.validateManifest(CvatJobType.IMAGE_BOXES, manifest),
      ).rejects.toThrow(new ValidationError(ErrorJob.ManifestValidationFailed));
    });

    it('should throw when a required hcaptcha property is missing', async () => {
      const manifest = {
        job_mode: faker.lorem.word(),
        request_type: JobCaptchaRequestType.IMAGE_LABEL_BINARY,
        request_config: {},
        requester_accuracy_target: faker.number.float({
          min: 0.5,
          max: 1,
          fractionDigits: 2,
        }),
        requester_max_repeats: faker.number.int({ min: 2, max: 10 }),
        requester_min_repeats: faker.number.int({ min: 1, max: 1 }),
        requester_question: { en: faker.lorem.sentence() },
        job_total_tasks: faker.number.int({ min: 1, max: 100 }),
        task_bid_price: faker.number.int({ min: 1, max: 10 }),
        public_results: faker.datatype.boolean(),
        oracle_stake: faker.number.int({ min: 1, max: 10 }),
        repo_uri: faker.internet.url(),
        ro_uri: faker.internet.url(),
        restricted_audience: {},
        requester_restricted_answer_set: {},
      };

      await expect(
        manifestService.validateManifest(
          HCaptchaJobType.HCAPTCHA,
          manifest as unknown as ManifestDto,
        ),
      ).rejects.toThrow(new ValidationError(ErrorJob.ManifestValidationFailed));
    });
  });

  describe('uploadManifest', () => {
    it('should upload a manifest successfully', async () => {
      const mockManifestData = {
        url: faker.internet.url(),
        hash: faker.string.uuid(),
      };

      mockStorageService.uploadJsonLikeData.mockResolvedValueOnce(
        mockManifestData,
      );

      const result = await manifestService.uploadManifest(
        faker.number.int(),
        { key: faker.lorem.word() },
        [],
      );

      expect(result).toEqual(mockManifestData);
    });

    it('should throw an error if upload fails', async () => {
      mockStorageService.uploadJsonLikeData.mockRejectedValueOnce(
        new ServerError('File not uploaded'),
      );

      await expect(
        manifestService.uploadManifest(
          faker.number.int(),
          { key: faker.lorem.word() },
          [],
        ),
      ).rejects.toThrow(ServerError);
    });
  });

  describe('downloadManifest', () => {
    it('should download and validate a manifest successfully', async () => {
      const mockManifest: ManifestDto = createMockFortuneManifest();

      mockStorageService.downloadJsonLikeData.mockResolvedValueOnce(
        mockManifest,
      );

      const result = await manifestService.downloadManifest(
        faker.internet.url(),
        FortuneJobType.FORTUNE,
      );

      expect(result).toEqual(mockManifest);
    });

    it('should throw if downloaded manifest is invalid', async () => {
      const mockManifest = createMockFortuneManifest();
      delete (mockManifest as Partial<typeof mockManifest>)
        .requesterDescription;

      mockStorageService.downloadJsonLikeData.mockResolvedValueOnce(
        mockManifest,
      );

      await expect(
        manifestService.downloadManifest(
          faker.internet.url(),
          FortuneJobType.FORTUNE,
        ),
      ).rejects.toThrow(new ValidationError(ErrorJob.ManifestValidationFailed));
    });
  });
});
