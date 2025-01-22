import { Test, TestingModule } from '@nestjs/testing';
import { VisionConfigService } from '../../common/config/vision-config.service';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { JobModerationService } from './job-moderation.service';
import { SlackConfigService } from '../../common/config/slack-config.service';
import { StorageService } from '../storage/storage.service';
import { ConfigService } from '@nestjs/config';
import { Encryption } from '@human-protocol/sdk';
import { S3ConfigService } from '../../common/config/s3-config.service';
import { createMock } from '@golevelup/ts-jest';
import { JobRepository } from './job.repository';
import { ErrorJobModeration } from '../../common/constants/errors';
import { sleep } from '../../common/utils/sleep';
import { sendSlackNotification } from '../../common/utils/slack';
import { JobStatus } from '../../common/enums/job';
import { DataModerationResultDto } from './job-moderation.dto';
import { JobEntity } from './job.entity';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { listObjectsInBucket } from '../../common/utils/storage';
import { Storage } from '@google-cloud/storage';

jest.mock('@google-cloud/vision');
jest.mock('@google-cloud/storage');
jest.mock('fs');
jest.mock('../../common/utils/storage', () => ({
  listObjectsInBucket: jest.fn(),
}));
jest.mock('../../common/utils/sleep', () => ({
  sleep: jest.fn(),
}));
jest.mock('../../common/utils/slack', () => ({
  sendSlackNotification: jest.fn(),
}));

describe('JobModerationService', () => {
  let jobModerationService: JobModerationService;
  let mockBatchAnnotateImages: jest.Mock;
  let jobRepository: JobRepository;
  let storageService: StorageService;

  beforeEach(async () => {
    mockBatchAnnotateImages = jest.fn();
    (ImageAnnotatorClient as unknown as jest.Mock).mockImplementation(() => ({
      batchAnnotateImages: mockBatchAnnotateImages,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobModerationService,
        { provide: StorageService, useValue: createMock<StorageService>() },
        ConfigService,
        S3ConfigService,
        Encryption,
        { provide: JobRepository, useValue: createMock<JobRepository>() },
        {
          provide: VisionConfigService,
          useValue: {
            projectId: 'test-project-id',
            privateKey: 'test-private-key',
            clientEmail: 'test-client-email',
          },
        },
        {
          provide: SlackConfigService,
          useValue: {
            abuseNotificationWebhookUrl: 'http://example.com/webhook',
          },
        },
      ],
    }).compile();

    jobModerationService =
      module.get<JobModerationService>(JobModerationService);
    jobRepository = module.get(JobRepository);
    storageService = module.get<StorageService>(StorageService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('jobModeration', () => {
    let mockDataModeration: jest.SpyInstance;

    beforeEach(async () => {
      mockDataModeration = jest
        .spyOn(jobModerationService, 'dataModeration')
        .mockImplementation();
    });

    it('should update the job as passed when there are no abusive content', async () => {
      const jobEntity = {
        manifestUrl: 'http://example.com/manifest.json',
      } as JobEntity;
      const manifest = { data: { data_url: 'http://example.com/data.json' } };
      const dataModerationResults = {
        positiveAbuseResults: [],
        possibleAbuseResults: [],
      } as DataModerationResultDto;

      storageService.downloadJsonLikeData = jest
        .fn()
        .mockResolvedValue(manifest);
      mockDataModeration.mockResolvedValue(dataModerationResults);

      const result = await jobModerationService.jobModeration(jobEntity);

      expect(storageService.downloadJsonLikeData).toHaveBeenCalledWith(
        jobEntity.manifestUrl,
      );
      expect(mockDataModeration).toHaveBeenCalledWith(manifest.data.data_url);
      expect(jobRepository.updateOne).toHaveBeenCalledWith({
        ...jobEntity,
        status: JobStatus.MODERATION_PASSED,
      });
      expect(result.status).toBe(JobStatus.MODERATION_PASSED);
    });

    it('should update the job as failed when there are abusive content', async () => {
      const jobEntity = {
        manifestUrl: 'http://example.com/manifest.json',
      } as JobEntity;
      const manifest = { data: { data_url: 'http://example.com/data.json' } };
      const dataModerationResults = {
        positiveAbuseResults: [{ imageUrl: 'http://example.com/image1.jpg' }],
      } as DataModerationResultDto;

      storageService.downloadJsonLikeData = jest
        .fn()
        .mockResolvedValue(manifest);
      mockDataModeration.mockResolvedValue(dataModerationResults);

      const result = await jobModerationService.jobModeration(jobEntity);

      expect(jobRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          status: JobStatus.FAILED,
          failedReason: expect.stringContaining('abusive content'),
        }),
      );
      expect(result.status).toBe(JobStatus.FAILED);
    });

    it('should send a Slack notification when there are possible issues and generate a signed URL', async () => {
      const jobEntity = {
        manifestUrl: 'http://example.com/manifest.json',
      } as JobEntity;
      const manifest = { data: { data_url: 'http://example.com/data.json' } };
      const dataModerationResults = {
        positiveAbuseResults: [] as any,
        possibleAbuseResults: [{ imageUrl: 'http://example.com/image2.jpg' }],
      } as DataModerationResultDto;

      storageService.downloadJsonLikeData = jest
        .fn()
        .mockResolvedValue(manifest);
      mockDataModeration.mockResolvedValue(dataModerationResults);

      const mockSignedUrl = 'http://signed-url.example.com/file.txt';
      jest.spyOn(Storage.prototype, 'bucket').mockReturnValue({
        file: jest.fn().mockReturnValue({
          createWriteStream: jest.fn(() => ({
            end: jest.fn().mockImplementation(() => {}),
          })),
          getSignedUrl: jest.fn().mockResolvedValue([mockSignedUrl]),
        }),
      } as any);

      await jobModerationService.jobModeration(jobEntity);

      expect(sendSlackNotification).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('possible moderation issues'),
      );
      expect(sendSlackNotification).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining(mockSignedUrl),
      );
      expect(jobRepository.updateOne).toHaveBeenCalledWith({
        ...jobEntity,
        status: JobStatus.MODERATION_PASSED,
      });
    });

    it('should handle errors from storage service and log them', async () => {
      const jobEntity = {
        manifestUrl: 'http://example.com/manifest.json',
      } as JobEntity;
      storageService.downloadJsonLikeData = jest
        .fn()
        .mockRejectedValue(new Error('Storage error'));

      await expect(
        jobModerationService.jobModeration(jobEntity),
      ).rejects.toThrow('Storage error');
      expect(jobRepository.updateOne).not.toHaveBeenCalled();
    });
  });

  describe('batchAnnotateImages', () => {
    it('should analyze images and return moderation results', async () => {
      const mockResponses = {
        responses: [
          {
            safeSearchAnnotation: {
              adult: 'VERY_UNLIKELY',
              violence: 'UNLIKELY',
              racy: 'POSSIBLE',
              spoof: 'UNLIKELY',
              medical: 'POSSIBLE',
            },
          },
        ],
      };
      mockBatchAnnotateImages.mockResolvedValue([mockResponses]);

      const result = await jobModerationService.batchAnnotateImages([
        'http://test-image.com/image1.jpg',
      ]);

      expect(result).toEqual([
        {
          imageUrl: 'http://test-image.com/image1.jpg',
          moderationResult: {
            adult: 'VERY_UNLIKELY',
            violence: 'UNLIKELY',
            racy: 'POSSIBLE',
            spoof: 'UNLIKELY',
            medical: 'POSSIBLE',
          },
        },
      ]);
    });

    it('should handle multiple batches and apply delay between batches', async () => {
      const mockResponses = {
        responses: [
          {
            safeSearchAnnotation: {
              adult: 'VERY_UNLIKELY',
              violence: 'UNLIKELY',
              racy: 'POSSIBLE',
              spoof: 'UNLIKELY',
              medical: 'POSSIBLE',
            },
          },
        ],
      };
      mockBatchAnnotateImages.mockResolvedValue([mockResponses]);

      const imageUrls = Array(60).fill('http://test-image.com/image.jpg');
      await jobModerationService.batchAnnotateImages(imageUrls);

      expect(sleep).toHaveBeenCalledTimes(3);
    });

    it('should handle null safeSearchAnnotation gracefully', async () => {
      const mockResponses = {
        responses: [
          {
            safeSearchAnnotation: null,
          },
        ],
      };
      mockBatchAnnotateImages.mockResolvedValue([mockResponses]);

      const result = await jobModerationService.batchAnnotateImages([
        'http://test-image.com/image1.jpg',
      ]);

      expect(result).toEqual([]);
    });

    it('should throw ControlledError when batchAnnotateImages fails', async () => {
      mockBatchAnnotateImages.mockRejectedValue(
        new Error('Batch request failed'),
      );

      await expect(
        jobModerationService.batchAnnotateImages([
          'http://test-image.com/image1.jpg',
        ]),
      ).rejects.toThrow(ErrorJobModeration.ContentModerationFailed);
    });
  });

  describe('dataModeration', () => {
    it('should process dataset and detect abuse', async () => {
      const mockListObjectsInBucket = jest
        .fn()
        .mockResolvedValue(['image1.jpg']);
      (listObjectsInBucket as jest.Mock) = mockListObjectsInBucket;

      mockBatchAnnotateImages.mockResolvedValue([
        {
          responses: [
            {
              safeSearchAnnotation: {
                adult: 'VERY_LIKELY',
                violence: 'UNLIKELY',
                racy: 'UNLIKELY',
                spoof: 'UNLIKELY',
                medical: 'UNLIKELY',
              },
            },
          ],
        },
      ]);

      const result = await jobModerationService.dataModeration(
        'http://test-bucket.com',
      );

      expect(result.positiveAbuseResults).toHaveLength(1);
      expect(result.possibleAbuseResults).toHaveLength(0);
    });

    it('should handle errors and throw a dataset processing error', async () => {
      const mockListObjectsInBucket = jest
        .fn()
        .mockRejectedValue(new Error('Failed to list objects'));
      (listObjectsInBucket as jest.Mock) = mockListObjectsInBucket;

      await expect(
        jobModerationService.dataModeration('http://test-bucket.com'),
      ).rejects.toThrow('Error processing dataset');
    });

    it('should return possible moderation results', async () => {
      const mockListObjectsInBucket = jest
        .fn()
        .mockResolvedValue(['image2.jpg']);
      (listObjectsInBucket as jest.Mock) = mockListObjectsInBucket;

      mockBatchAnnotateImages.mockResolvedValue([
        {
          responses: [
            {
              safeSearchAnnotation: {
                adult: 'POSSIBLE',
                violence: 'UNLIKELY',
                racy: 'POSSIBLE',
                spoof: 'UNLIKELY',
                medical: 'UNLIKELY',
              },
            },
          ],
        },
      ]);

      const result = await jobModerationService.dataModeration(
        'http://test-bucket.com',
      );

      expect(result.positiveAbuseResults).toHaveLength(0);
      expect(result.possibleAbuseResults).toHaveLength(1);
    });
  });
});
