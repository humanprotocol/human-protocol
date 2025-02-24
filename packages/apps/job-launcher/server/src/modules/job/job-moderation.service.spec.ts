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
import { sendSlackNotification } from '../../common/utils/slack';
import { JobStatus } from '../../common/enums/job';
import { JobEntity } from './job.entity';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { listObjectsInBucket } from '../../common/utils/storage';
import {
  convertToGCSPath,
  convertToHttpUrl,
} from '../../common/utils/gcstorage';
import { ControlledError } from '../../common/errors/controlled';

jest.mock('@google-cloud/vision');
jest.mock('@google-cloud/storage');
jest.mock('fs');
jest.mock('../../common/utils/storage', () => ({
  listObjectsInBucket: jest.fn(),
}));
jest.mock('../../common/utils/gcstorage', () => ({
  convertToHttpUrl: jest.fn(),
  convertToGCSPath: jest.fn(),
  constructGcsPath: jest.fn(),
}));
jest.mock('../../common/utils/slack', () => ({
  sendSlackNotification: jest.fn(),
}));

describe.only('JobModerationService', () => {
  let jobModerationService: JobModerationService;
  let mockBatchAnnotateImages: jest.Mock;
  let mockAsyncBatchAnnotateImages: jest.Mock;
  let storageService: StorageService;

  beforeEach(async () => {
    mockBatchAnnotateImages = jest.fn();
    mockAsyncBatchAnnotateImages = jest.fn();
    (ImageAnnotatorClient as unknown as jest.Mock).mockImplementation(() => ({
      batchAnnotateImages: mockBatchAnnotateImages,
      asyncBatchAnnotateImages: mockAsyncBatchAnnotateImages,
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
            tempAsyncResultsBucket: 'test-temp-bucket',
            moderationResultsBucket: 'test-moderation-results-bucket',
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
    storageService = module.get<StorageService>(StorageService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('asyncDataModeration', () => {
    it('should process dataset and call asyncBatchAnnotateImages', async () => {
      (listObjectsInBucket as jest.Mock).mockResolvedValue([
        'image1.jpg',
        'image2.png',
      ]);
      (convertToGCSPath as jest.Mock).mockReturnValue('gs://bucket-name');

      const mockAsyncBatchAnnotateImages = jest
        .spyOn(jobModerationService, 'asyncBatchAnnotateImages')
        .mockResolvedValue();

      await jobModerationService.asyncDataModeration(
        'https://storage.googleapis.com/bucket-name',
      );

      expect(listObjectsInBucket).toHaveBeenCalledWith(
        new URL('https://storage.googleapis.com/bucket-name'),
      );
      expect(convertToGCSPath).toHaveBeenCalledWith(
        'https://storage.googleapis.com/bucket-name',
      );
      expect(mockAsyncBatchAnnotateImages).toHaveBeenCalledWith(
        ['gs://bucket-name/image1.jpg', 'gs://bucket-name/image2.png'],
        'https://storage.googleapis.com/bucket-name',
      );
    });

    it('should handle errors and throw ControlledError', async () => {
      (listObjectsInBucket as jest.Mock).mockRejectedValue(
        new Error('Failed to list objects'),
      );

      await expect(
        jobModerationService.asyncDataModeration(
          'https://storage.googleapis.com/bucket-name',
        ),
      ).rejects.toThrow(ErrorJobModeration.ErrorProcessingDataset);
    });
  });

  describe('asyncBatchAnnotateImages', () => {
    it('should start async annotation and log results', async () => {
      const mockOperation = {
        name: 'operation-123',
        promise: jest.fn().mockResolvedValue([
          {
            outputConfig: {
              gcsDestination: { uri: 'gs://output-bucket/results.json' },
            },
          },
        ]),
      };

      mockAsyncBatchAnnotateImages.mockResolvedValue([mockOperation]);

      await jobModerationService.asyncBatchAnnotateImages(
        ['gs://bucket-name/image1.jpg'],
        'https://storage.googleapis.com/bucket-name',
      );

      expect(mockAsyncBatchAnnotateImages).toHaveBeenCalledWith(
        expect.objectContaining({ requests: expect.any(Array) }),
      );
    });
  });

  describe('parseJobModerationResults', () => {
    let mockCollectModerationResults: jest.Mock;
    let mockHandleAbuseLinks: jest.Mock;

    beforeEach(() => {
      mockCollectModerationResults = jest.fn();
      jobModerationService['collectModerationResults'] =
        mockCollectModerationResults;
      mockHandleAbuseLinks = jest.fn();
      jobModerationService['handleAbuseLinks'] = mockHandleAbuseLinks;
    });

    const jobEntity = {
      id: 123,
      manifestUrl: 'http://test-bucket.com/manifest.json',
      status: JobStatus.PENDING,
      failedReason: '',
    } as JobEntity;

    it('should mark job as failed when positive abuse results are found', async () => {
      const mockManifest = { data: { data_url: 'http://data-url.com' } };
      const mockModerationResults = {
        positiveAbuseResults: [
          { imageUrl: 'http://image1.jpg' },
          { imageUrl: 'http://image2.jpg' },
        ],
        possibleAbuseResults: [],
      };

      storageService.downloadJsonLikeData = jest
        .fn()
        .mockResolvedValue(mockManifest);
      mockCollectModerationResults.mockResolvedValue(mockModerationResults);

      const result =
        await jobModerationService.parseJobModerationResults(jobEntity);

      expect(result.status).toBe(JobStatus.FAILED);
      expect(result.failedReason).toContain(
        'Job failed due to detected abusive content. See the detailed report.',
      );
      expect(mockHandleAbuseLinks).toHaveBeenCalledWith(
        ['http://image1.jpg', 'http://image2.jpg'],
        jobEntity.id,
        true,
      );
    });

    it('should mark job as possible abuse in review when possible abuse results are found', async () => {
      // Arrange
      const mockManifest = { data: { data_url: 'http://data-url.com' } };
      const mockModerationResults = {
        positiveAbuseResults: [],
        possibleAbuseResults: [
          { imageUrl: 'http://image3.jpg' },
          { imageUrl: 'http://image4.jpg' },
        ],
      };

      storageService.downloadJsonLikeData = jest
        .fn()
        .mockResolvedValue(mockManifest);
      mockCollectModerationResults.mockResolvedValue(mockModerationResults);

      // Act
      const result =
        await jobModerationService.parseJobModerationResults(jobEntity);

      // Assert
      expect(result.status).toBe(JobStatus.POSSIBLE_ABUSE_IN_REVIEW);
      expect(result.failedReason).toContain(
        'Job flagged for review due to possible moderation concerns. See the detailed report.',
      );
      expect(mockHandleAbuseLinks).toHaveBeenCalledWith(
        ['http://image3.jpg', 'http://image4.jpg'],
        jobEntity.id,
        false,
      );
    });

    it('should mark job as moderation passed when no abusive content is found', async () => {
      const mockManifest = { data: { data_url: 'http://data-url.com' } };
      const mockModerationResults = {
        positiveAbuseResults: [],
        possibleAbuseResults: [],
      };

      storageService.downloadJsonLikeData = jest
        .fn()
        .mockResolvedValue(mockManifest);
      mockCollectModerationResults.mockResolvedValue(mockModerationResults);

      const result =
        await jobModerationService.parseJobModerationResults(jobEntity);

      expect(result.status).toBe(JobStatus.MODERATION_PASSED);
    });

    it('should failed if there is an error parsing the job moderation results', async () => {
      const mockManifest = { data: { data_url: 'http://data-url.com' } };
      storageService.downloadJsonLikeData = jest
        .fn()
        .mockResolvedValue(mockManifest);
      mockCollectModerationResults.mockRejectedValue(
        new Error('Failed to collect results'),
      );

      const result =
        await jobModerationService.parseJobModerationResults(jobEntity);

      expect(result.status).toBe(JobStatus.FAILED);
    });
  });

  describe('collectModerationResults', () => {
    let mockDownloadFileContent: jest.Mock;

    beforeEach(() => {
      mockDownloadFileContent = jest.fn();
      jobModerationService['downloadFileContent'] = mockDownloadFileContent;
    });

    it('should return categorized results when valid files are found', async () => {
      const mockFilesResponse = [
        { name: 'file1.json' },
        { name: 'file2.json' },
      ];
      const mockFileContent = {
        responses: [{ safeSearchAnnotation: { adult: 'LIKELY' } }],
      };

      (convertToHttpUrl as jest.Mock).mockReturnValue(
        'http://storage.googleapis.com',
      );

      jest.spyOn(Storage.prototype, 'bucket').mockReturnValue({
        getFiles: jest.fn().mockResolvedValue([mockFilesResponse]),
      } as any);

      mockDownloadFileContent.mockResolvedValue(mockFileContent);

      const result = await jobModerationService.collectModerationResults(
        'http://test-bucket.com',
      );

      expect(result).toHaveProperty('positiveAbuseResults');
      expect(result.positiveAbuseResults).toHaveLength(2);
    });

    it('should throw error when no files are found', async () => {
      jest.spyOn(Storage.prototype, 'bucket').mockReturnValue({
        getFiles: jest.fn().mockResolvedValue([[]]),
      } as any);

      await expect(
        jobModerationService.collectModerationResults('http://test-bucket.com'),
      ).rejects.toThrow(ControlledError);
      await expect(
        jobModerationService.collectModerationResults('http://test-bucket.com'),
      ).rejects.toThrow('Results parsing failed');
    });

    it('should log and skip invalid content in files', async () => {
      const mockFilesResponse = [{ name: 'file1.json' }];
      const invalidFileContent = {};
      jest.spyOn(Storage.prototype, 'bucket').mockReturnValue({
        getFiles: jest.fn().mockResolvedValue([mockFilesResponse]),
      } as any);
      mockDownloadFileContent.mockResolvedValue(invalidFileContent);

      const result = await jobModerationService.collectModerationResults(
        'http://test-bucket.com',
      );

      expect(result).toHaveProperty('positiveAbuseResults');
      expect(result.positiveAbuseResults).toHaveLength(0);
    });

    it('should handle errors during file download', async () => {
      const mockFilesResponse = [{ name: 'file1.json' }];
      jest.spyOn(Storage.prototype, 'bucket').mockReturnValue({
        getFiles: jest.fn().mockResolvedValue([mockFilesResponse]),
      } as any);
      mockDownloadFileContent.mockRejectedValue(new Error('Download failed'));

      await expect(
        jobModerationService.collectModerationResults('http://test-bucket.com'),
      ).rejects.toThrow(ControlledError);
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
        jobModerationService['visionConfigService'].moderationResultsBucket,
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
        jobModerationService['visionConfigService'].moderationResultsBucket,
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

  describe('categorizeModerationResults', () => {
    it('should categorize images with VERY_LIKELY or LIKELY as positiveAbuseResults', () => {
      const mockModerationResults = [
        {
          safeSearchAnnotation: {
            adult: 'VERY_LIKELY',
            violence: 'UNLIKELY',
            racy: 'POSSIBLE',
            spoof: 'UNLIKELY',
            medical: 'UNLIKELY',
          },
          context: { uri: 'gs://test-bucket/image1.jpg' },
        },
        {
          safeSearchAnnotation: {
            adult: 'LIKELY',
            violence: 'UNLIKELY',
            racy: 'UNLIKELY',
            spoof: 'UNLIKELY',
            medical: 'UNLIKELY',
          },
          context: { uri: 'gs://test-bucket/image2.jpg' },
        },
      ];

      const result = (jobModerationService as any).categorizeModerationResults(
        mockModerationResults,
      );

      expect(result.positiveAbuseResults).toHaveLength(2);
      expect(result.possibleAbuseResults).toHaveLength(1);
    });

    it('should categorize images with POSSIBLE as possibleAbuseResults', () => {
      const mockModerationResults = [
        {
          safeSearchAnnotation: {
            adult: 'POSSIBLE',
            violence: 'UNLIKELY',
            racy: 'POSSIBLE',
            spoof: 'UNLIKELY',
            medical: 'UNLIKELY',
          },
          context: { uri: 'gs://test-bucket/image3.jpg' },
        },
      ];

      const result = (jobModerationService as any).categorizeModerationResults(
        mockModerationResults,
      );

      expect(result.positiveAbuseResults).toHaveLength(0);
      expect(result.possibleAbuseResults).toHaveLength(1);
    });

    it('should filter out results with missing safeSearchAnnotation', () => {
      const mockModerationResults = [
        {
          safeSearchAnnotation: null,
          context: { uri: 'gs://test-bucket/image4.jpg' },
        },
      ];

      const result = (jobModerationService as any).categorizeModerationResults(
        mockModerationResults,
      );

      expect(result.positiveAbuseResults).toHaveLength(0);
      expect(result.possibleAbuseResults).toHaveLength(0);
    });
  });
});
