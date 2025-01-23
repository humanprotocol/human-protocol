import { Test, TestingModule } from '@nestjs/testing';
import { VisionConfigService } from '../../common/config/vision-config.service';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { JobModerationService } from './job-moderation.service';
import { SlackConfigService } from '../../common/config/slack-config.service';
import { StorageService } from '../storage/storage.service';
import { ConfigService } from '@nestjs/config';
import { Encryption } from '@human-protocol/sdk';
import { Storage } from '@google-cloud/storage';
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
    let mockHandleAbuseLinks: jest.SpyInstance;

    beforeEach(async () => {
      mockDataModeration = jest
        .spyOn(jobModerationService, 'dataModeration')
        .mockImplementation();
      mockHandleAbuseLinks = jest
        .spyOn(jobModerationService, 'handleAbuseLinks')
        .mockImplementation();
    });

    it('should update the job as MODERATION_PASSED when there are no abusive content', async () => {
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
      expect(jobRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          status: JobStatus.MODERATION_PASSED,
        }),
      );
      expect(result.status).toBe(JobStatus.MODERATION_PASSED);
    });

    it('should update the job as FAILED when abusive content is found', async () => {
      const jobEntity = {
        manifestUrl: 'http://example.com/manifest.json',
      } as JobEntity;

      const manifest = { data: { data_url: 'http://example.com/data.json' } };
      const dataModerationResults = {
        positiveAbuseResults: [{ imageUrl: 'http://example.com/image1.jpg' }],
        possibleAbuseResults: [] as any,
      } as DataModerationResultDto;

      storageService.downloadJsonLikeData = jest
        .fn()
        .mockResolvedValue(manifest);
      mockDataModeration.mockResolvedValue(dataModerationResults);

      const result = await jobModerationService.jobModeration(jobEntity);

      expect(mockHandleAbuseLinks).toHaveBeenCalledWith(
        ['http://example.com/image1.jpg'],
        jobEntity.id,
        true,
      );
      expect(jobRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          status: JobStatus.FAILED,
          failedReason: expect.stringContaining('abusive content'),
        }),
      );
      expect(result.status).toBe(JobStatus.FAILED);
    });

    it('should update the job as POSSIBLE_ABUSE_IN_REVIEW when possible abusive content is found', async () => {
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

      const result = await jobModerationService.jobModeration(jobEntity);

      expect(mockHandleAbuseLinks).toHaveBeenCalledWith(
        ['http://example.com/image2.jpg'],
        jobEntity.id,
        false,
      );
      expect(jobRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          status: JobStatus.POSSIBLE_ABUSE_IN_REVIEW,
          failedReason: expect.stringContaining(
            'potentially containing abusive content',
          ),
        }),
      );
      expect(result.status).toBe(JobStatus.POSSIBLE_ABUSE_IN_REVIEW);
    });

    it('should throw an error if manifest download fails', async () => {
      const jobEntity = {
        manifestUrl: 'http://example.com/manifest.json',
      } as JobEntity;

      storageService.downloadJsonLikeData = jest
        .fn()
        .mockRejectedValue(new Error('Download error'));

      await expect(
        jobModerationService.jobModeration(jobEntity),
      ).rejects.toThrow('Download error');
      expect(jobRepository.updateOne).not.toHaveBeenCalled();
    });

    it('should handle data moderation errors gracefully', async () => {
      const jobEntity = {
        manifestUrl: 'http://example.com/manifest.json',
      } as JobEntity;

      const manifest = { data: { data_url: 'http://example.com/data.json' } };

      storageService.downloadJsonLikeData = jest
        .fn()
        .mockResolvedValue(manifest);
      mockDataModeration.mockRejectedValue(new Error('Moderation error'));

      await expect(
        jobModerationService.jobModeration(jobEntity),
      ).rejects.toThrow('Moderation error');
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

  describe('handleAbuseLinks', () => {
    let mockSignedUrl: string;

    beforeEach(() => {
      mockSignedUrl = 'http://signed-url.example.com/file.txt';
      jest.spyOn(Storage.prototype, 'bucket').mockReturnValue({
        file: jest.fn().mockReturnValue({
          createWriteStream: jest.fn(() => ({
            end: jest.fn().mockImplementation(() => {}),
          })),
          getSignedUrl: jest.fn().mockResolvedValue([mockSignedUrl]),
        }),
      } as any);
    });

    it('should save abusive image links to GCS and send a Slack notification for confirmed abuse', async () => {
      const imageLinks = [
        'http://example.com/image1.jpg',
        'http://example.com/image2.jpg',
      ];
      const jobId = 123;
      const isConfirmedAbuse = true;

      await jobModerationService.handleAbuseLinks(
        imageLinks,
        jobId,
        isConfirmedAbuse,
      );

      expect(Storage.prototype.bucket).toHaveBeenCalledWith(
        jobModerationService['visionConfigService'].positiveAbuseResultsBucket,
      );
      expect(sendSlackNotification).toHaveBeenCalledWith(
        jobModerationService['slackConfigService'].abuseNotificationWebhookUrl,
        expect.stringContaining(mockSignedUrl),
      );
    });

    it('should save possible abusive image links to GCS and send a Slack notification for possible abuse', async () => {
      const imageLinks = ['http://example.com/image3.jpg'];
      const jobId = 456;
      const isConfirmedAbuse = false;

      await jobModerationService.handleAbuseLinks(
        imageLinks,
        jobId,
        isConfirmedAbuse,
      );

      expect(Storage.prototype.bucket).toHaveBeenCalledWith(
        jobModerationService['visionConfigService'].possibleAbuseResultsBucket,
      );
      expect(sendSlackNotification).toHaveBeenCalledWith(
        jobModerationService['slackConfigService'].abuseNotificationWebhookUrl,
        expect.stringContaining(mockSignedUrl),
      );
    });

    it('should handle errors when saving image links to GCS', async () => {
      const imageLinks = ['http://example.com/image4.jpg'];
      const jobId = 789;
      const isConfirmedAbuse = true;

      jest.spyOn(Storage.prototype, 'bucket').mockReturnValue({
        file: jest.fn().mockReturnValue({
          createWriteStream: jest.fn(() => ({
            end: jest.fn().mockImplementation(() => {
              throw new Error('GCS Error');
            }),
          })),
          getSignedUrl: jest.fn(),
        }),
      } as any);

      await expect(
        jobModerationService.handleAbuseLinks(
          imageLinks,
          jobId,
          isConfirmedAbuse,
        ),
      ).rejects.toThrow('GCS Error');

      expect(sendSlackNotification).not.toHaveBeenCalled();
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
