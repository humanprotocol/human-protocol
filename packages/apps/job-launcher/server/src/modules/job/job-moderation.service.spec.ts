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
import { JobModerationTaskStatus, JobStatus } from '../../common/enums/job';
import { JobEntity } from './job.entity';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { listObjectsInBucket } from '../../common/utils/storage';
import {
  convertToGCSPath,
  convertToHttpUrl,
  isGCSBucketUrl,
} from '../../common/utils/gcstorage';
import { ControlledError } from '../../common/errors/controlled';
import { JobModerationTaskEntity } from './job-moderation-task.entity';
import { JobModerationTaskRepository } from './job-moderation-task.repository';
import {
  checkModerationLevels,
  getFileName,
} from '../../common/utils/job-moderation';
import { JOB_MODERATION_BATCH_SIZE_PER_TASK } from '../../common/constants';

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
  isGCSBucketUrl: jest.fn(),
}));
jest.mock('../../common/utils/slack', () => ({
  sendSlackNotification: jest.fn(),
}));
jest.mock('../../common/utils/job-moderation', () => ({
  checkModerationLevels: jest.fn(),
  getFileName: jest.fn(),
}));

describe('JobModerationService', () => {
  let jobModerationService: JobModerationService;
  let mockBatchAnnotateImages: jest.Mock;
  let mockAsyncBatchAnnotateImages: jest.Mock;
  let storageService: StorageService;
  let jobModerationTaskRepository: JobModerationTaskRepository;
  let jobRepository: JobRepository;

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
          provide: JobModerationTaskRepository,
          useValue: createMock<JobModerationTaskRepository>(),
        },
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

    jobRepository = module.get<JobRepository>(JobRepository);
    jobModerationTaskRepository = module.get<JobModerationTaskRepository>(
      JobModerationTaskRepository,
    );
    storageService = module.get<StorageService>(StorageService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('jobModeration', () => {
    let jobEntity: JobEntity;
    let manifestMock: any;

    beforeEach(() => {
      jobEntity = {
        id: 1,
        manifestUrl: 'https://storage.googleapis.com/bucket-name/manifest.json',
      } as JobEntity;

      manifestMock = {
        data: {
          data_url: 'gs://bucket-name/data',
        },
      };

      jest
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValue(manifestMock);
      (isGCSBucketUrl as jest.Mock).mockReturnValue(true);
      (listObjectsInBucket as jest.Mock).mockResolvedValue([
        'file1.jpg',
        'file2.jpg',
        'file3.jpg',
        'folder/', // "folder/" should be filtered out
      ]);

      jest
        .spyOn(jobModerationTaskRepository, 'save')
        .mockResolvedValue(JobModerationTaskEntity as any);
      jest.spyOn(jobRepository, 'update').mockResolvedValue(jobEntity as any);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should download the manifest JSON', async () => {
      await jobModerationService.jobModeration(jobEntity);

      expect(storageService.downloadJsonLikeData).toHaveBeenCalledWith(
        jobEntity.manifestUrl,
      );
    });

    it('should throw an error if data_url is not a valid GCS bucket URL', async () => {
      (isGCSBucketUrl as jest.Mock).mockReturnValue(false);

      await expect(
        jobModerationService.jobModeration(jobEntity),
      ).rejects.toThrow(ErrorJobModeration.DataMustBeStoredInGCS);
    });

    it('should list objects in the GCS bucket', async () => {
      await jobModerationService.jobModeration(jobEntity);

      expect(listObjectsInBucket).toHaveBeenCalledWith(
        new URL('gs://bucket-name/data'),
      );
    });

    it('should create job moderation tasks in batches', async () => {
      const batchSize = JOB_MODERATION_BATCH_SIZE_PER_TASK;
      const testFiles = new Array(batchSize * 2 + 1)
        .fill(null)
        .map((_, i) => `file${i + 1}.jpg`);
      (listObjectsInBucket as jest.Mock).mockResolvedValue(testFiles);

      await jobModerationService.jobModeration(jobEntity);

      // Expect 3 batches (2 full + 1 remaining)
      expect(jobModerationTaskRepository.save).toHaveBeenCalledTimes(1);
      expect(jobModerationTaskRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            from: 1,
            to: batchSize,
            status: JobModerationTaskStatus.PENDING,
          }),
          expect.objectContaining({
            from: batchSize + 1,
            to: batchSize * 2,
            status: JobModerationTaskStatus.PENDING,
          }),
          expect.objectContaining({
            from: batchSize * 2 + 1,
            to: testFiles.length,
            status: JobModerationTaskStatus.PENDING,
          }),
        ]),
      );
    });

    it('should update the job status to UNDER_MODERATION', async () => {
      await jobModerationService.jobModeration(jobEntity);

      expect(jobRepository.update).toHaveBeenCalledWith(jobEntity.id, {
        status: JobStatus.UNDER_MODERATION,
      });
    });
  });

  describe('processJobModerationTask', () => {
    let mockUpdateOne: jest.SpyInstance;
    let mockAsyncBatchAnnotateImages: jest.SpyInstance;

    beforeEach(() => {
      mockUpdateOne = jest
        .spyOn(jobModerationTaskRepository, 'updateOne')
        .mockResolvedValue({ id: 123 } as JobModerationTaskEntity);
      mockAsyncBatchAnnotateImages = jest
        .spyOn(jobModerationService, 'asyncBatchAnnotateImages')
        .mockResolvedValue();
      (getFileName as jest.Mock).mockReturnValue('mocked-file-path');
    });

    const jobModerationTask = {
      id: 123,
      job: { id: 456 } as JobEntity,
      dataUrl: 'https://storage.googleapis.com/bucket-name',
      status: JobModerationTaskStatus.PENDING,
      from: 1,
      to: 2,
    } as JobModerationTaskEntity;

    it('should process dataset and call asyncBatchAnnotateImages', async () => {
      // Mock resolved values
      (listObjectsInBucket as jest.Mock).mockResolvedValue([
        'folder/',
        'image1.jpg',
        'image2.jpg',
        'image3.jpg',
      ]);
      (convertToGCSPath as jest.Mock).mockReturnValue('gs://bucket-name');

      await jobModerationService.processJobModerationTask(jobModerationTask);

      expect(listObjectsInBucket).toHaveBeenCalledWith(
        new URL(jobModerationTask.dataUrl),
      );
      expect(convertToGCSPath).toHaveBeenCalledWith(jobModerationTask.dataUrl);

      // Validate correct files are selected (from index 1 to 2, ignoring folders)
      expect(mockAsyncBatchAnnotateImages).toHaveBeenCalledWith(
        ['gs://bucket-name/image1.jpg', 'gs://bucket-name/image2.jpg'],
        'mocked-file-path',
      );

      // Ensure status is updated to PROCESSED
      expect(mockUpdateOne).toHaveBeenCalledWith(
        expect.objectContaining({ status: JobModerationTaskStatus.PROCESSED }),
      );
    });

    it('should handle errors and mark the task as FAILED', async () => {
      (listObjectsInBucket as jest.Mock).mockRejectedValue(
        new Error('Failed to list objects'),
      );

      await expect(
        jobModerationService.processJobModerationTask(jobModerationTask),
      ).rejects.toThrow(ErrorJobModeration.ErrorProcessingDataset);

      // Ensure status is updated to FAILED
      expect(mockUpdateOne).toHaveBeenCalledWith(
        expect.objectContaining({ status: JobModerationTaskStatus.FAILED }),
      );
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
    let mockUpdateOne: jest.SpyInstance;

    beforeEach(() => {
      mockCollectModerationResults = jest.fn();
      jobModerationService['collectModerationResults'] =
        mockCollectModerationResults;

      mockHandleAbuseLinks = jest.fn();
      jobModerationService['handleAbuseLinks'] = mockHandleAbuseLinks;

      mockUpdateOne = jest
        .spyOn(jobModerationTaskRepository, 'updateOne')
        .mockResolvedValue({ id: 123 } as JobModerationTaskEntity);
      (getFileName as jest.Mock).mockReturnValue('mocked-file-path');
    });

    const jobModerationTask = {
      id: 123,
      job: { id: 456 } as JobEntity,
      dataUrl: 'http://test-bucket.com/data.json',
      status: JobModerationTaskStatus.PROCESSED,
      abuseReason: '',
    } as JobModerationTaskEntity;

    it('should mark task as POSITIVE_ABUSE when positive abuse results are found', async () => {
      const mockModerationResults = {
        positiveAbuseResults: [
          { imageUrl: 'http://image1.jpg' },
          { imageUrl: 'http://image2.jpg' },
        ],
        possibleAbuseResults: [],
      };

      mockCollectModerationResults.mockResolvedValue(mockModerationResults);

      const result =
        await jobModerationService.parseJobModerationResults(jobModerationTask);

      expect(result.status).toBe(JobModerationTaskStatus.POSITIVE_ABUSE);
      expect(result.abuseReason).toContain(
        'Job flagged for review due to detected abusive content',
      );
      expect(mockHandleAbuseLinks).toHaveBeenCalledWith(
        ['http://image1.jpg', 'http://image2.jpg'],
        'mocked-file-path',
        jobModerationTask.id,
        jobModerationTask.job.id,
        true,
      );
      expect(mockUpdateOne).toHaveBeenCalledWith(result);
    });

    it('should mark task as POSSIBLE_ABUSE when possible abuse results are found', async () => {
      const mockModerationResults = {
        positiveAbuseResults: [],
        possibleAbuseResults: [
          { imageUrl: 'http://image3.jpg' },
          { imageUrl: 'http://image4.jpg' },
        ],
      };

      mockCollectModerationResults.mockResolvedValue(mockModerationResults);

      const result =
        await jobModerationService.parseJobModerationResults(jobModerationTask);

      expect(result.status).toBe(JobModerationTaskStatus.POSSIBLE_ABUSE);
      expect(result.abuseReason).toContain(
        'Job flagged for review due to possible moderation concerns',
      );
      expect(mockHandleAbuseLinks).toHaveBeenCalledWith(
        ['http://image3.jpg', 'http://image4.jpg'],
        'mocked-file-path',
        jobModerationTask.id,
        jobModerationTask.job.id,
        false,
      );
      expect(mockUpdateOne).toHaveBeenCalledWith(result);
    });

    it('should mark task as PASSED when no abusive content is found', async () => {
      const mockModerationResults = {
        positiveAbuseResults: [],
        possibleAbuseResults: [],
      };

      mockCollectModerationResults.mockResolvedValue(mockModerationResults);

      const result =
        await jobModerationService.parseJobModerationResults(jobModerationTask);

      expect(result.status).toBe(JobModerationTaskStatus.PASSED);
      expect(mockHandleAbuseLinks).not.toHaveBeenCalled();
      expect(mockUpdateOne).toHaveBeenCalledWith(result);
    });

    it('should mark task as FAILED when an error occurs', async () => {
      mockCollectModerationResults.mockRejectedValue(
        new Error('Failed to collect results'),
      );

      const result =
        await jobModerationService.parseJobModerationResults(jobModerationTask);

      expect(result.status).toBe(JobModerationTaskStatus.FAILED);
      expect(mockUpdateOne).toHaveBeenCalledWith(result);
    });
  });

  describe('completeJobModeration', () => {
    let jobEntity: JobEntity;
    let jobModerationTasks: JobModerationTaskEntity[];

    beforeEach(() => {
      jobEntity = { id: 1, status: JobStatus.UNDER_MODERATION } as JobEntity;

      jest.spyOn(jobModerationTaskRepository, 'find').mockResolvedValue([]);
      jest.spyOn(jobRepository, 'updateOne').mockResolvedValue(jobEntity);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return early if there are pending or processed tasks', async () => {
      jobModerationTasks = [
        {
          id: 101,
          status: JobModerationTaskStatus.PENDING,
        } as JobModerationTaskEntity,
        {
          id: 102,
          status: JobModerationTaskStatus.PROCESSED,
        } as JobModerationTaskEntity,
      ];
      jest
        .spyOn(jobModerationTaskRepository, 'find')
        .mockResolvedValue(jobModerationTasks);

      await jobModerationService.completeJobModeration(jobEntity);

      expect(jobRepository.updateOne).not.toHaveBeenCalled();
      expect(sendSlackNotification).not.toHaveBeenCalled();
    });

    it('should update job status to MODERATION_PASSED if all tasks succeed', async () => {
      jobModerationTasks = [
        {
          id: 101,
          status: JobModerationTaskStatus.PASSED,
        } as JobModerationTaskEntity,
        {
          id: 102,
          status: JobModerationTaskStatus.PASSED,
        } as JobModerationTaskEntity,
      ];
      jest
        .spyOn(jobModerationTaskRepository, 'find')
        .mockResolvedValue(jobModerationTasks);

      await jobModerationService.completeJobModeration(jobEntity);

      expect(jobRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({ status: JobStatus.MODERATION_PASSED }),
      );
      expect(sendSlackNotification).not.toHaveBeenCalled();
    });

    it('should update job status to POSSIBLE_ABUSE_IN_REVIEW if any task fails', async () => {
      jobModerationTasks = [
        {
          id: 101,
          status: JobModerationTaskStatus.FAILED,
        } as JobModerationTaskEntity,
        {
          id: 102,
          status: JobModerationTaskStatus.PASSED,
        } as JobModerationTaskEntity,
      ];
      jest
        .spyOn(jobModerationTaskRepository, 'find')
        .mockResolvedValue(jobModerationTasks);

      await jobModerationService.completeJobModeration(jobEntity);

      expect(jobRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({ status: JobStatus.POSSIBLE_ABUSE_IN_REVIEW }),
      );
    });

    it('should send Slack notification if any task is flagged', async () => {
      jobModerationTasks = [
        {
          id: 101,
          status: JobModerationTaskStatus.POSITIVE_ABUSE,
        } as JobModerationTaskEntity,
        {
          id: 102,
          status: JobModerationTaskStatus.POSSIBLE_ABUSE,
        } as JobModerationTaskEntity,
      ];
      jest
        .spyOn(jobModerationTaskRepository, 'find')
        .mockResolvedValue(jobModerationTasks);

      await jobModerationService.completeJobModeration(jobEntity);

      expect(sendSlackNotification).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Job 1 requires review:'),
      );
    });

    it('should log error and throw an exception if something goes wrong', async () => {
      const error = new Error('Database error');
      jest.spyOn(jobModerationTaskRepository, 'find').mockRejectedValue(error);
      const loggerErrorMock = jest.spyOn(jobModerationService.logger, 'error');

      await expect(
        jobModerationService.completeJobModeration(jobEntity),
      ).rejects.toThrow('Failed to complete job moderation');

      expect(loggerErrorMock).toHaveBeenCalledWith(
        'Error completing job moderation:',
        error,
      );
    });
  });

  describe('collectModerationResults', () => {
    let mockDownloadFileContent: jest.Mock;

    beforeEach(() => {
      mockDownloadFileContent = jest.fn();
      jobModerationService['downloadFileContent'] = mockDownloadFileContent;
    });

    it('should return categorized results when valid files are found', async () => {
      (checkModerationLevels as jest.Mock)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true);

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
      const fileName = 'file_name';
      const jobModerationTaskId = 1;
      const jobId = 123;
      const isConfirmedAbuse = true;

      await jobModerationService.handleAbuseLinks(
        imageLinks,
        fileName,
        jobModerationTaskId,
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
      const fileName = 'file_name';
      const jobModerationTaskId = 1;
      const jobId = 456;
      const isConfirmedAbuse = false;

      await jobModerationService.handleAbuseLinks(
        imageLinks,
        fileName,
        jobModerationTaskId,
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
      const fileName = 'file_name';
      const jobModerationTaskId = 1;
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
          fileName,
          jobModerationTaskId,
          jobId,
          isConfirmedAbuse,
        ),
      ).rejects.toThrow('GCS Error');

      expect(sendSlackNotification).not.toHaveBeenCalled();
    });
  });

  describe('categorizeModerationResults', () => {
    it('should categorize images with VERY_LIKELY or LIKELY as positiveAbuseResults', () => {
      (checkModerationLevels as jest.Mock)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

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
      (checkModerationLevels as jest.Mock)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

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
