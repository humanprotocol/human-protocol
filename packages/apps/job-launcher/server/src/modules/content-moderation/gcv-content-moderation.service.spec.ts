import { faker } from '@faker-js/faker';
import { Storage } from '@google-cloud/storage';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { Test, TestingModule } from '@nestjs/testing';

import { SlackConfigService } from '../../common/config/slack-config.service';
import { VisionConfigService } from '../../common/config/vision-config.service';
import { ErrorContentModeration } from '../../common/constants/errors';
import { ContentModerationRequestStatus } from '../../common/enums/content-moderation';
import { JobStatus } from '../../common/enums/job';
import { ControlledError } from '../../common/errors/controlled';
import {
  convertToGCSPath,
  convertToHttpUrl,
  isGCSBucketUrl,
} from '../../common/utils/gcstorage';
import { checkModerationLevels } from '../../common/utils/job-moderation';
import { sendSlackNotification } from '../../common/utils/slack';
import { listObjectsInBucket } from '../../common/utils/storage';
import { JobEntity } from '../job/job.entity';
import { JobRepository } from '../job/job.repository';
import { StorageService } from '../storage/storage.service';
import { ContentModerationRequestEntity } from './content-moderation-request.entity';
import { ContentModerationRequestRepository } from './content-moderation-request.repository';
import { GCVContentModerationService } from './gcv-content-moderation.service';

// Mock out any external modules or utilities you rely on:
jest.mock('../../common/utils/storage', () => ({
  ...jest.requireActual('../../common/utils/storage'),
  listObjectsInBucket: jest.fn(),
}));
jest.mock('../../common/utils/slack', () => ({
  sendSlackNotification: jest.fn(),
}));
jest.mock('../../common/utils/gcstorage', () => ({
  convertToHttpUrl: jest.fn(),
  convertToGCSPath: jest.fn(),
  constructGcsPath: jest.fn(),
  isGCSBucketUrl: jest.fn(),
}));
jest.mock('../../common/utils/job-moderation', () => ({
  checkModerationLevels: jest.fn(),
  getFileName: jest.fn(),
}));

jest.mock('@google-cloud/vision');
jest.mock('@google-cloud/storage');

describe('GCVContentModerationService', () => {
  let service: GCVContentModerationService;

  // Mock repositories and other providers
  let jobRepository: JobRepository;
  let storageService: StorageService;
  let slackConfigService: SlackConfigService;
  let contentModerationRequestRepository: ContentModerationRequestRepository;

  // Mocked GCS + Vision clients
  const mockVisionClient = {
    asyncBatchAnnotateImages: jest.fn(),
  };
  const mockStorage = {
    bucket: jest.fn().mockReturnValue({
      getFiles: jest.fn(),
      file: jest.fn().mockReturnValue({
        createWriteStream: jest.fn(() => ({ end: jest.fn() })),
        getSignedUrl: jest.fn(),
        download: jest.fn(),
      }),
    }),
  };

  beforeAll(async () => {
    // Force the Vision & Storage clients to return our mock objects
    (ImageAnnotatorClient as unknown as jest.Mock).mockImplementation(
      () => mockVisionClient,
    );
    (Storage as unknown as jest.Mock).mockImplementation(() => mockStorage);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GCVContentModerationService,
        {
          provide: JobRepository,
          useValue: {
            findById: jest.fn(),
            updateOne: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            downloadJsonLikeData: jest.fn(),
          },
        },
        {
          provide: SlackConfigService,
          useValue: {
            abuseNotificationWebhookUrl: faker.internet.url(),
          },
        },
        {
          provide: VisionConfigService,
          useValue: {
            projectId: faker.string.uuid(),
            privateKey: faker.string.alphanumeric(40),
            clientEmail: faker.internet.email(),
            moderationResultsBucket: faker.word.sample(),
            moderationResultsFilesPath: faker.word.sample(),
          },
        },
        {
          provide: ContentModerationRequestRepository,
          useValue: {
            findByJobId: jest.fn(),
            findByJobIdAndStatus: jest.fn(),
            updateOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GCVContentModerationService>(
      GCVContentModerationService,
    );
    jobRepository = module.get<JobRepository>(JobRepository);
    storageService = module.get<StorageService>(StorageService);
    slackConfigService = module.get<SlackConfigService>(SlackConfigService);
    contentModerationRequestRepository =
      module.get<ContentModerationRequestRepository>(
        ContentModerationRequestRepository,
      );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Initialization', () => {
    it('should instantiate the service correctly', () => {
      expect(service).toBeDefined();
    });

    // (Optional) If you have any init logic that can fail, test it here.
  });

  describe('moderateJob', () => {
    it('should call all steps in sequence (successful flow)', async () => {
      const jobEntity: JobEntity = {
        id: faker.number.int(),
        status: JobStatus.PAID,
      } as JobEntity;

      // Spy on private methods
      const ensureRequestsSpy = jest
        .spyOn<any, any>(service, 'ensureRequests')
        .mockResolvedValue(undefined);
      const processRequestsSpy = jest
        .spyOn<any, any>(service, 'processRequests')
        .mockResolvedValue(undefined);
      const parseRequestsSpy = jest
        .spyOn<any, any>(service, 'parseRequests')
        .mockResolvedValue(undefined);
      const finalizeJobSpy = jest
        .spyOn<any, any>(service, 'finalizeJob')
        .mockResolvedValue(undefined);

      await service.moderateJob(jobEntity);

      expect(ensureRequestsSpy).toHaveBeenCalledWith(jobEntity);
      expect(processRequestsSpy).toHaveBeenCalledWith(jobEntity);
      expect(parseRequestsSpy).toHaveBeenCalledWith(jobEntity);
      expect(finalizeJobSpy).toHaveBeenCalledWith(jobEntity);
    });

    it('should throw if any step fails', async () => {
      const jobEntity: JobEntity = {
        id: faker.number.int(),
        status: JobStatus.PAID,
      } as JobEntity;

      jest
        .spyOn<any, any>(service, 'ensureRequests')
        .mockRejectedValue(new Error('Simulated Failure'));

      await expect(service.moderateJob(jobEntity)).rejects.toThrow(
        'Simulated Failure',
      );
    });
  });

  describe('ensureRequests', () => {
    it('should do nothing if requests already exist', async () => {
      const jobEntity: JobEntity = {
        id: faker.number.int(),
        status: JobStatus.PAID,
      } as JobEntity;

      (
        contentModerationRequestRepository.findByJobId as jest.Mock
      ).mockResolvedValue([{} as ContentModerationRequestEntity]);

      await (service as any).ensureRequests(jobEntity);

      expect(
        contentModerationRequestRepository.findByJobId,
      ).toHaveBeenCalledWith(jobEntity.id);
      expect(jobRepository.updateOne).not.toHaveBeenCalled(); // no updates if already exist
    });

    it('should set job to MODERATION_PASSED if data_url is missing', async () => {
      const jobEntity: JobEntity = {
        id: faker.number.int(),
        status: JobStatus.PAID,
      } as JobEntity;

      (
        contentModerationRequestRepository.findByJobId as jest.Mock
      ).mockResolvedValue([]);
      (storageService.downloadJsonLikeData as jest.Mock).mockResolvedValue({
        data: { data_url: undefined },
      });

      await (service as any).ensureRequests(jobEntity);

      expect(jobRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          status: JobStatus.MODERATION_PASSED,
        }),
      );
    });

    it('should set job to MODERATION_PASSED if data_url is not a GCS URL', async () => {
      const jobEntity: JobEntity = {
        id: faker.number.int(),
        status: JobStatus.PAID,
      } as JobEntity;

      (
        contentModerationRequestRepository.findByJobId as jest.Mock
      ).mockResolvedValue([]);
      (storageService.downloadJsonLikeData as jest.Mock).mockResolvedValue({
        data: { data_url: faker.internet.url() }, // e.g. HTTP URL, not GCS
      });
      (isGCSBucketUrl as jest.Mock).mockReturnValue(false);

      await (service as any).ensureRequests(jobEntity);
      expect(jobRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          status: JobStatus.MODERATION_PASSED,
        }),
      );
    });

    it('should create new requests if valid GCS URL and files exist', async () => {
      const jobEntity: JobEntity = {
        id: faker.number.int(),
        status: JobStatus.PAID,
      } as JobEntity;

      (
        contentModerationRequestRepository.findByJobId as jest.Mock
      ).mockResolvedValue([]);
      (storageService.downloadJsonLikeData as jest.Mock).mockResolvedValue({
        data: { data_url: `gs://${faker.word.sample()}/somePath` },
      });
      (isGCSBucketUrl as jest.Mock).mockReturnValue(true);

      (listObjectsInBucket as jest.Mock).mockResolvedValue([
        'file1.jpg',
        'file2.jpg',
      ]);
      jest.spyOn(jobRepository, 'updateOne').mockResolvedValue(jobEntity);

      await (service as any).ensureRequests(jobEntity);

      // The job should now be UNDER_MODERATION
      expect(jobRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          status: JobStatus.UNDER_MODERATION,
        }),
      );
    });

    it('should do nothing if no files found on GCS', async () => {
      const jobEntity: JobEntity = {
        id: faker.number.int(),
        status: JobStatus.PAID,
      } as JobEntity;

      (
        contentModerationRequestRepository.findByJobId as jest.Mock
      ).mockResolvedValue([]);
      (storageService.downloadJsonLikeData as jest.Mock).mockResolvedValue({
        data: { data_url: `gs://${faker.word.sample()}/somePath` },
      });
      (isGCSBucketUrl as jest.Mock).mockReturnValue(true);

      (listObjectsInBucket as jest.Mock).mockResolvedValue([]);
      jest.spyOn(jobRepository, 'updateOne').mockResolvedValue(jobEntity);

      await (service as any).ensureRequests(jobEntity);

      // No calls to update job => no requests created
      expect(jobRepository.updateOne).not.toHaveBeenCalled();
    });

    it('should throw if the database or storage calls fail', async () => {
      const jobEntity: JobEntity = {
        id: faker.number.int(),
        status: JobStatus.PAID,
      } as JobEntity;

      (
        contentModerationRequestRepository.findByJobId as jest.Mock
      ).mockRejectedValue(new Error('DB error'));

      await expect((service as any).ensureRequests(jobEntity)).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('processRequests', () => {
    it('should process all PENDING requests', async () => {
      const jobEntity: JobEntity = { id: faker.number.int() } as JobEntity;
      const pendingRequest: ContentModerationRequestEntity = {
        id: faker.number.int(),
      } as ContentModerationRequestEntity;

      // Mock getRequests to return that pending request
      (service as any).getRequests = jest
        .fn()
        .mockResolvedValue([pendingRequest]);
      const processSingleRequestSpy = jest
        .spyOn<any, any>(service, 'processSingleRequest')
        .mockResolvedValue(undefined);

      await (service as any).processRequests(jobEntity);

      expect(processSingleRequestSpy).toHaveBeenCalledWith(pendingRequest);
    });

    it('should mark request as FAILED if an error occurs during processing', async () => {
      const jobEntity: JobEntity = { id: faker.number.int() } as JobEntity;
      const requestEntity: ContentModerationRequestEntity = {
        id: faker.number.int(),
      } as ContentModerationRequestEntity;

      (service as any).getRequests = jest
        .fn()
        .mockResolvedValue([requestEntity]);
      jest
        .spyOn<any, any>(service, 'processSingleRequest')
        .mockRejectedValue(new Error('Processing error'));

      await (service as any).processRequests(jobEntity);

      expect(contentModerationRequestRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ContentModerationRequestStatus.FAILED,
        }),
      );
    });
  });

  describe('parseRequests', () => {
    it('should parse all PROCESSED requests', async () => {
      const jobEntity: JobEntity = { id: faker.number.int() } as JobEntity;
      const processedRequest: ContentModerationRequestEntity = {
        id: faker.number.int(),
      } as ContentModerationRequestEntity;

      (service as any).getRequests = jest
        .fn()
        .mockResolvedValue([processedRequest]);
      const parseSingleRequestSpy = jest
        .spyOn<any, any>(service, 'parseSingleRequest')
        .mockResolvedValue(undefined);

      await (service as any).parseRequests(jobEntity);
      expect(parseSingleRequestSpy).toHaveBeenCalledWith(processedRequest);
    });

    it('should mark request as FAILED if parseSingleRequest throws', async () => {
      const jobEntity: JobEntity = { id: faker.number.int() } as JobEntity;
      const processedRequest: ContentModerationRequestEntity = {
        id: faker.number.int(),
      } as ContentModerationRequestEntity;

      (service as any).getRequests = jest
        .fn()
        .mockResolvedValue([processedRequest]);
      jest
        .spyOn<any, any>(service, 'parseSingleRequest')
        .mockRejectedValue(new Error('Parsing error'));

      await (service as any).parseRequests(jobEntity);

      expect(contentModerationRequestRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ContentModerationRequestStatus.FAILED,
        }),
      );
    });
  });

  describe('finalizeJob', () => {
    it('should set job to MODERATION_PASSED if all requests are passed', async () => {
      const jobEntity: JobEntity = { id: faker.number.int() } as JobEntity;
      (
        contentModerationRequestRepository.findByJobId as jest.Mock
      ).mockResolvedValue([
        { status: ContentModerationRequestStatus.PASSED },
        { status: ContentModerationRequestStatus.PASSED },
      ]);

      await (service as any).finalizeJob(jobEntity);

      expect(jobRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          status: JobStatus.MODERATION_PASSED,
        }),
      );
    });

    it('should set job to POSSIBLE_ABUSE_IN_REVIEW if any request is flagged', async () => {
      const jobEntity: JobEntity = { id: faker.number.int() } as JobEntity;
      (
        contentModerationRequestRepository.findByJobId as jest.Mock
      ).mockResolvedValue([
        { status: ContentModerationRequestStatus.POSSIBLE_ABUSE },
      ]);

      await (service as any).finalizeJob(jobEntity);

      expect(jobRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          status: JobStatus.POSSIBLE_ABUSE_IN_REVIEW,
        }),
      );
    });

    it('should do nothing if there are still pending requests', async () => {
      const jobEntity: JobEntity = { id: faker.number.int() } as JobEntity;
      (
        contentModerationRequestRepository.findByJobId as jest.Mock
      ).mockResolvedValue([{ status: ContentModerationRequestStatus.PENDING }]);

      await (service as any).finalizeJob(jobEntity);

      expect(jobRepository.updateOne).not.toHaveBeenCalled();
    });

    it('should throw if DB calls fail', async () => {
      const jobEntity: JobEntity = { id: faker.number.int() } as JobEntity;
      (
        contentModerationRequestRepository.findByJobId as jest.Mock
      ).mockRejectedValue(new Error('DB Error'));

      await expect((service as any).finalizeJob(jobEntity)).rejects.toThrow(
        'DB Error',
      );
    });
  });

  describe('processSingleRequest', () => {
    it('should slice the valid files and call asyncBatchAnnotateImages', async () => {
      const requestEntity: ContentModerationRequestEntity = {
        id: faker.number.int(),
        dataUrl: `gs://${faker.word.sample()}`,
        from: 1,
        to: 2,
        job: { id: faker.number.int() } as JobEntity,
      } as any;

      (service as any).getValidFiles = jest
        .fn()
        .mockResolvedValue(['file1.jpg', 'file2.jpg', 'file3.jpg']); // 3 files
      (convertToGCSPath as jest.Mock).mockReturnValue('gs://converted');
      const asyncBatchAnnotateImagesSpy = jest
        .spyOn<any, any>(service, 'asyncBatchAnnotateImages')
        .mockResolvedValue(undefined);

      await (service as any).processSingleRequest(requestEntity);

      // We expect only file1 & file2 in the batch
      expect(asyncBatchAnnotateImagesSpy).toHaveBeenCalledWith(
        ['gs://converted/file1.jpg', 'gs://converted/file2.jpg'],
        expect.any(String),
      );

      expect(contentModerationRequestRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ContentModerationRequestStatus.PROCESSED,
        }),
      );
    });

    it('should throw if asyncBatchAnnotateImages fails', async () => {
      const requestEntity: ContentModerationRequestEntity = {
        id: faker.number.int(),
        dataUrl: `gs://${faker.word.sample()}`,
        from: 1,
        to: 2,
        job: { id: faker.number.int() } as JobEntity,
      } as any;

      (service as any).getValidFiles = jest
        .fn()
        .mockResolvedValue(['file1.jpg']);
      jest
        .spyOn<any, any>(service, 'asyncBatchAnnotateImages')
        .mockRejectedValue(new Error('Vision Failure'));

      await expect(
        (service as any).processSingleRequest(requestEntity),
      ).rejects.toThrow('Vision Failure');
    });

    it('should handle getValidFiles throwing an error', async () => {
      const requestEntity: ContentModerationRequestEntity = {
        id: faker.number.int(),
        dataUrl: `gs://${faker.word.sample()}`,
        from: 1,
        to: 2,
        job: { id: faker.number.int() } as JobEntity,
      } as any;

      (service as any).getValidFiles = jest
        .fn()
        .mockRejectedValue(new Error('Some GCS error'));

      await expect(
        (service as any).processSingleRequest(requestEntity),
      ).rejects.toThrow('Some GCS error');
    });
  });

  describe('parseSingleRequest', () => {
    it('should set PASSED if no abuse found', async () => {
      const requestEntity: ContentModerationRequestEntity = {
        id: faker.number.int(),
        job: { id: faker.number.int() } as JobEntity,
      } as any;
      jest
        .spyOn<any, any>(service, 'collectModerationResults')
        .mockResolvedValue({
          positiveAbuseResults: [],
          possibleAbuseResults: [],
        });

      await (service as any).parseSingleRequest(requestEntity);
      expect(contentModerationRequestRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ContentModerationRequestStatus.PASSED,
        }),
      );
    });

    it('should set POSITIVE_ABUSE if positiveAbuseResults are found', async () => {
      const requestEntity: ContentModerationRequestEntity = {
        id: faker.number.int(),
        job: { id: faker.number.int() } as JobEntity,
      } as any;
      jest
        .spyOn<any, any>(service, 'collectModerationResults')
        .mockResolvedValue({
          positiveAbuseResults: [{ imageUrl: 'abuse.jpg' }],
          possibleAbuseResults: [],
        });
      jest
        .spyOn<any, any>(service, 'handleAbuseLinks')
        .mockResolvedValue(undefined);

      await (service as any).parseSingleRequest(requestEntity);
      expect(service['handleAbuseLinks']).toHaveBeenCalled();
      expect(contentModerationRequestRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ContentModerationRequestStatus.POSITIVE_ABUSE,
        }),
      );
    });

    it('should set POSSIBLE_ABUSE if possibleAbuseResults are found', async () => {
      const requestEntity: ContentModerationRequestEntity = {
        id: faker.number.int(),
        job: { id: faker.number.int() } as JobEntity,
      } as any;
      jest
        .spyOn<any, any>(service, 'collectModerationResults')
        .mockResolvedValue({
          positiveAbuseResults: [],
          possibleAbuseResults: [{ imageUrl: 'maybe.jpg' }],
        });
      jest
        .spyOn<any, any>(service, 'handleAbuseLinks')
        .mockResolvedValue(undefined);

      await (service as any).parseSingleRequest(requestEntity);
      expect(service['handleAbuseLinks']).toHaveBeenCalled();
      expect(contentModerationRequestRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ContentModerationRequestStatus.POSSIBLE_ABUSE,
        }),
      );
    });

    it('should set FAILED if collectModerationResults throws', async () => {
      const requestEntity: ContentModerationRequestEntity = {
        id: faker.number.int(),
        job: { id: faker.number.int() } as JobEntity,
      } as any;
      jest
        .spyOn<any, any>(service, 'collectModerationResults')
        .mockRejectedValue(new Error('Some parse error'));

      await expect(
        (service as any).parseSingleRequest(requestEntity),
      ).rejects.toThrow('Some parse error');
      expect(contentModerationRequestRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ContentModerationRequestStatus.FAILED,
        }),
      );
    });
  });

  describe('collectModerationResults', () => {
    it('should throw if no result files are found', async () => {
      (mockStorage.bucket as any).mockReturnValue({
        getFiles: jest.fn().mockResolvedValue([[]]),
      });

      await expect(
        (service as any).collectModerationResults(faker.word.sample()),
      ).rejects.toThrow(ControlledError);
    });

    it('should parse the JSON from each file and accumulate responses', async () => {
      const fakeResponse = {
        responses: [
          { safeSearchAnnotation: { adult: 'LIKELY' } },
          { safeSearchAnnotation: { adult: 'UNKNOWN' } },
        ],
      };
      (mockStorage.bucket as any).mockReturnValue({
        getFiles: jest.fn().mockResolvedValue([
          [
            {
              name: 'file1.json',
              download: jest
                .fn()
                .mockResolvedValue([Buffer.from(JSON.stringify(fakeResponse))]),
            },
            {
              name: 'file2.json',
              download: jest.fn().mockResolvedValue([
                Buffer.from(
                  JSON.stringify({
                    responses: [
                      { safeSearchAnnotation: { violence: 'POSSIBLE' } },
                    ],
                  }),
                ),
              ]),
            },
          ],
        ]),
      });

      // Provide a mock for categorizeModerationResults
      service['categorizeModerationResults'] = jest.fn().mockReturnValue({
        positiveAbuseResults: [],
        possibleAbuseResults: [],
      });

      const results = await (service as any).collectModerationResults(
        faker.word.sample(),
      );
      expect(service['categorizeModerationResults']).toHaveBeenCalledWith(
        expect.arrayContaining([
          { safeSearchAnnotation: { adult: 'LIKELY' } },
          { safeSearchAnnotation: { adult: 'UNKNOWN' } },
          { safeSearchAnnotation: { violence: 'POSSIBLE' } },
        ]),
      );
      expect(results).toHaveProperty('positiveAbuseResults');
      expect(results).toHaveProperty('possibleAbuseResults');
    });

    it('should throw a ControlledError if GCS fails', async () => {
      (mockStorage.bucket as any).mockReturnValue({
        getFiles: jest.fn().mockRejectedValue(new Error('GCS error')),
      });

      await expect(
        (service as any).collectModerationResults(faker.word.sample()),
      ).rejects.toThrow(ErrorContentModeration.ResultsParsingFailed);
    });
  });

  describe('categorizeModerationResults', () => {
    it('should split results into positiveAbuseResults and possibleAbuseResults correctly', () => {
      // Mock checkModerationLevels calls
      (checkModerationLevels as jest.Mock)
        .mockReturnValueOnce(true) // => goes to positive
        .mockReturnValueOnce(false) // => not possible
        .mockReturnValueOnce(true); // => goes to possible

      (convertToHttpUrl as jest.Mock).mockReturnValue('http://some-url');
      const fakeResponses = [
        {
          safeSearchAnnotation: { adult: 'LIKELY' },
          context: { uri: 'gs://abc/1.jpg' },
        },
        {
          safeSearchAnnotation: { adult: 'UNLIKELY' },
          context: { uri: 'gs://abc/2.jpg' },
        },
        {
          safeSearchAnnotation: { violence: 'POSSIBLE' },
          context: { uri: 'gs://abc/3.jpg' },
        },
      ];

      const result = (service as any).categorizeModerationResults(
        fakeResponses,
      );
      expect(result.positiveAbuseResults).toHaveLength(1);
      expect(result.possibleAbuseResults).toHaveLength(1);
    });

    it('should ignore responses without safeSearchAnnotation', () => {
      const fakeResponses = [
        { context: { uri: 'gs://abc/1.jpg' } }, // no annotation
        {
          safeSearchAnnotation: { adult: 'LIKELY' },
          context: { uri: 'gs://abc/2.jpg' },
        },
      ];

      (checkModerationLevels as jest.Mock).mockReturnValue(true);
      const result = (service as any).categorizeModerationResults(
        fakeResponses,
      );
      expect(result.positiveAbuseResults).toHaveLength(1);
    });

    it('should handle empty responses array', () => {
      const result = (service as any).categorizeModerationResults([]);
      expect(result.positiveAbuseResults).toHaveLength(0);
      expect(result.possibleAbuseResults).toHaveLength(0);
    });
  });

  describe('asyncBatchAnnotateImages', () => {
    it('should call Vision API successfully', async () => {
      const mockOperation = {
        promise: jest.fn().mockResolvedValue([
          {
            outputConfig: {
              gcsDestination: { uri: faker.internet.url() },
            },
          },
        ]),
      };
      mockVisionClient.asyncBatchAnnotateImages.mockResolvedValue([
        mockOperation,
      ]);

      await (service as any).asyncBatchAnnotateImages(
        [`gs://${faker.word.sample()}/image1.jpg`],
        faker.word.sample(),
      );

      expect(mockVisionClient.asyncBatchAnnotateImages).toHaveBeenCalledWith(
        expect.objectContaining({
          requests: expect.any(Array),
          outputConfig: expect.any(Object),
        }),
      );
    });

    it('should throw ControlledError on Vision API error', async () => {
      mockVisionClient.asyncBatchAnnotateImages.mockRejectedValue(
        new Error('Vision error'),
      );

      await expect(
        (service as any).asyncBatchAnnotateImages([], faker.word.sample()),
      ).rejects.toThrow(ControlledError);
    });
  });

  describe('handleAbuseLinks', () => {
    it('should write a file of links and send Slack notification (confirmed abuse)', async () => {
      const links = [faker.internet.url(), faker.internet.url()];
      const fileName = faker.word.sample();
      const requestId = faker.number.int();
      const jobId = faker.number.int();
      const mockSignedUrl = faker.internet.url();

      (mockStorage.bucket as any).mockReturnValue({
        file: jest.fn().mockReturnValue({
          createWriteStream: jest.fn(() => ({ end: jest.fn() })),
          getSignedUrl: jest.fn().mockResolvedValue([mockSignedUrl]),
        }),
      });

      await (service as any).handleAbuseLinks(
        links,
        fileName,
        requestId,
        jobId,
        true,
      );

      expect(sendSlackNotification).toHaveBeenCalledWith(
        slackConfigService.abuseNotificationWebhookUrl,
        expect.stringContaining(mockSignedUrl),
      );
    });

    it('should handle possible abuse similarly', async () => {
      const links = [faker.internet.url()];
      const fileName = faker.word.sample();
      const requestId = faker.number.int();
      const jobId = faker.number.int();
      const mockSignedUrl = faker.internet.url();

      (mockStorage.bucket as any).mockReturnValue({
        file: jest.fn().mockReturnValue({
          createWriteStream: jest.fn(() => ({ end: jest.fn() })),
          getSignedUrl: jest.fn().mockResolvedValue([mockSignedUrl]),
        }),
      });

      await (service as any).handleAbuseLinks(
        links,
        fileName,
        requestId,
        jobId,
        false,
      );

      expect(sendSlackNotification).toHaveBeenCalledWith(
        slackConfigService.abuseNotificationWebhookUrl,
        expect.stringContaining(mockSignedUrl),
      );
    });

    it('should throw if getSignedUrl fails', async () => {
      (mockStorage.bucket as any).mockReturnValue({
        file: jest.fn().mockReturnValue({
          createWriteStream: jest.fn(() => ({ end: jest.fn() })),
          getSignedUrl: jest
            .fn()
            .mockRejectedValue(new Error('Signed URL error')),
        }),
      });

      await expect(
        (service as any).handleAbuseLinks([], 'fileName', 1, 1, true),
      ).rejects.toThrow('Signed URL error');
    });
  });

  describe('getRequests', () => {
    it('should return requests from memory if jobEntity has them', async () => {
      const jobEntity: JobEntity = {
        id: faker.number.int(),
        contentModerationRequests: [
          { status: ContentModerationRequestStatus.PENDING },
          { status: ContentModerationRequestStatus.PASSED },
        ],
      } as JobEntity;

      const result = await (service as any).getRequests(
        jobEntity,
        ContentModerationRequestStatus.PENDING,
      );
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(ContentModerationRequestStatus.PENDING);
    });

    it('should query DB if no in-memory requests', async () => {
      const jobEntity: JobEntity = { id: faker.number.int() } as JobEntity;

      (
        contentModerationRequestRepository.findByJobIdAndStatus as jest.Mock
      ).mockResolvedValue([
        { status: ContentModerationRequestStatus.PROCESSED },
      ]);

      const result = await (service as any).getRequests(
        jobEntity,
        ContentModerationRequestStatus.PROCESSED,
      );
      expect(
        contentModerationRequestRepository.findByJobIdAndStatus,
      ).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('getValidFiles', () => {
    it('should return cached value if present in bucketListCache', async () => {
      const dataUrl = `gs://${faker.word.sample()}/somePath`;
      service['bucketListCache'].set(dataUrl, ['cached1.jpg', 'cached2.jpg']);

      const result = await (service as any).getValidFiles(dataUrl);
      expect(result).toEqual(['cached1.jpg', 'cached2.jpg']);
      expect(listObjectsInBucket).not.toHaveBeenCalled();
    });

    it('should call listObjectsInBucket if not cached and filter out directories', async () => {
      const dataUrl = `gs://${faker.word.sample()}/somePath`;
      (listObjectsInBucket as jest.Mock).mockResolvedValue([
        'file1.jpg',
        'dir1/', // simulating a "directory"
        'file2.png',
      ]);

      const result = await (service as any).getValidFiles(dataUrl);
      expect(result).toEqual(['file1.jpg', 'file2.png']);
      expect(service['bucketListCache'].get(dataUrl)).toEqual(result);
    });

    it('should throw if listObjectsInBucket fails', async () => {
      const dataUrl = `gs://${faker.word.sample()}/somePath`;
      (listObjectsInBucket as jest.Mock).mockRejectedValue(
        new Error('Bucket error'),
      );

      await expect((service as any).getValidFiles(dataUrl)).rejects.toThrow(
        'Bucket error',
      );
    });
  });
});
