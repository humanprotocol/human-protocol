import { faker } from '@faker-js/faker';
import { Storage } from '@google-cloud/storage';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { Test, TestingModule } from '@nestjs/testing';

import { SlackConfigService } from '../../common/config/slack-config.service';
import { VisionConfigService } from '../../common/config/vision-config.service';
import { ErrorContentModeration } from '../../common/constants/errors';
import { ContentModerationLevel } from '../../common/enums/gcv';
import { ContentModerationRequestStatus } from '../../common/enums/content-moderation';
import { JobStatus } from '../../common/enums/job';
import { ControlledError } from '../../common/errors/controlled';
import { JobEntity } from '../job/job.entity';
import { JobRepository } from '../job/job.repository';
import { StorageService } from '../storage/storage.service';
import { ContentModerationRequestEntity } from './content-moderation-request.entity';
import { ContentModerationRequestRepository } from './content-moderation-request.repository';
import { GCVContentModerationService } from './gcv-content-moderation.service';
import { sendSlackNotification } from '../../common/utils/slack';
import { listObjectsInBucket } from '../../common/utils/storage';

jest.mock('@google-cloud/storage');
jest.mock('@google-cloud/vision');
jest.mock('../../common/utils/slack', () => ({
  sendSlackNotification: jest.fn(),
}));
jest.mock('../../common/utils/storage', () => ({
  ...jest.requireActual('../../common/utils/storage'),
  listObjectsInBucket: jest.fn(),
}));

describe('GCVContentModerationService', () => {
  let service: GCVContentModerationService;

  let jobRepository: JobRepository;
  let contentModerationRequestRepository: ContentModerationRequestRepository;
  let slackConfigService: SlackConfigService;
  let storageService: StorageService;

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
  const mockVisionClient = {
    asyncBatchAnnotateImages: jest.fn(),
  };

  beforeAll(async () => {
    (Storage as unknown as jest.Mock).mockImplementation(() => mockStorage);
    (ImageAnnotatorClient as unknown as jest.Mock).mockImplementation(
      () => mockVisionClient,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GCVContentModerationService,
        {
          provide: JobRepository,
          useValue: {
            updateOne: jest.fn(),
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
          provide: SlackConfigService,
          useValue: {
            abuseNotificationWebhookUrl: faker.internet.url(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            downloadJsonLikeData: jest.fn(),
          },
        },
      ],
    }).compile();
    service = module.get<GCVContentModerationService>(
      GCVContentModerationService,
    );
    jobRepository = module.get<JobRepository>(JobRepository);
    contentModerationRequestRepository =
      module.get<ContentModerationRequestRepository>(
        ContentModerationRequestRepository,
      );
    slackConfigService = module.get<SlackConfigService>(SlackConfigService);
    storageService = module.get<StorageService>(StorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('moderateJob (public)', () => {
    it('should call ensureRequests, processRequests, parseRequests, finalizeJob in order', async () => {
      const jobEntity = { id: faker.number.int() } as JobEntity;

      const ensureRequestsSpy = jest
        .spyOn<any, any>(service, 'ensureRequests')
        .mockResolvedValueOnce(undefined);
      const processRequestsSpy = jest
        .spyOn<any, any>(service, 'processRequests')
        .mockResolvedValueOnce(undefined);
      const parseRequestsSpy = jest
        .spyOn<any, any>(service, 'parseRequests')
        .mockResolvedValueOnce(undefined);
      const finalizeJobSpy = jest
        .spyOn<any, any>(service, 'finalizeJob')
        .mockResolvedValueOnce(undefined);

      await service.moderateJob(jobEntity);

      expect(ensureRequestsSpy).toHaveBeenCalledWith(jobEntity);
      expect(processRequestsSpy).toHaveBeenCalledWith(jobEntity);
      expect(parseRequestsSpy).toHaveBeenCalledWith(jobEntity);
      expect(finalizeJobSpy).toHaveBeenCalledWith(jobEntity);
    });

    it('should propagate an error if ensureRequests fails', async () => {
      const jobEntity = { id: faker.number.int() } as JobEntity;

      jest
        .spyOn<any, any>(service, 'ensureRequests')
        .mockRejectedValueOnce(new Error('Simulated ensureRequests error'));

      await expect(service.moderateJob(jobEntity)).rejects.toThrow(
        'Simulated ensureRequests error',
      );
    });
  });

  describe('ensureRequests', () => {
    it('should do nothing if requests already exist', async () => {
      const jobEntity = {
        id: faker.number.int(),
        status: JobStatus.PAID,
      } as JobEntity;
      (
        contentModerationRequestRepository.findByJobId as jest.Mock
      ).mockResolvedValueOnce([{} as ContentModerationRequestEntity]);

      await (service as any).ensureRequests(jobEntity);
      expect(jobRepository.updateOne).not.toHaveBeenCalled();
    });

    it('should return if job status not PAID or UNDER_MODERATION', async () => {
      const jobEntity = {
        id: faker.number.int(),
        status: JobStatus.CANCELED,
      } as JobEntity;
      (
        contentModerationRequestRepository.findByJobId as jest.Mock
      ).mockResolvedValueOnce([]);

      await (service as any).ensureRequests(jobEntity);
      expect(jobRepository.updateOne).not.toHaveBeenCalled();
    });

    it('should set job to MODERATION_PASSED if data_url is missing or invalid', async () => {
      const jobEntity = {
        id: faker.number.int(),
        status: JobStatus.PAID,
        manifestUrl: faker.internet.url(),
      } as JobEntity;

      (
        contentModerationRequestRepository.findByJobId as jest.Mock
      ).mockResolvedValueOnce([]);
      (storageService.downloadJsonLikeData as jest.Mock).mockResolvedValueOnce({
        data: { data_url: null },
      });

      await (service as any).ensureRequests(jobEntity);
      expect(jobEntity.status).toBe(JobStatus.MODERATION_PASSED);
      expect(jobRepository.updateOne).toHaveBeenCalledWith(jobEntity);
    });

    it('should do nothing if no valid files found in GCS', async () => {
      const jobEntity = {
        id: faker.number.int(),
        status: JobStatus.PAID,
        manifestUrl: faker.internet.url(),
      } as JobEntity;

      (
        contentModerationRequestRepository.findByJobId as jest.Mock
      ).mockResolvedValueOnce([]);
      (storageService.downloadJsonLikeData as jest.Mock).mockResolvedValueOnce({
        data: {
          data_url: `gs://${faker.word.sample({ length: { min: 5, max: 10 } })}`,
        },
      });

      (listObjectsInBucket as jest.Mock).mockResolvedValueOnce([]);
      await (service as any).ensureRequests(jobEntity);

      expect(jobRepository.updateOne).not.toHaveBeenCalled();
    });

    it('should create new requests in PENDING and set job to UNDER_MODERATION', async () => {
      const jobEntity = {
        id: faker.number.int(),
        status: JobStatus.PAID,
        manifestUrl: faker.internet.url(),
      } as JobEntity;

      (
        contentModerationRequestRepository.findByJobId as jest.Mock
      ).mockResolvedValueOnce([]);
      (storageService.downloadJsonLikeData as jest.Mock).mockResolvedValueOnce({
        data: {
          data_url: `gs://${faker.word.sample({ length: { min: 5, max: 10 } })}`,
        },
      });

      (listObjectsInBucket as jest.Mock).mockResolvedValueOnce([
        `${faker.word.sample()}.jpg`,
        `${faker.word.sample()}.jpg`,
        `${faker.word.sample()}.jpg`,
      ]);

      await (service as any).ensureRequests(jobEntity);

      expect(jobEntity.status).toBe(JobStatus.UNDER_MODERATION);
      expect(jobRepository.updateOne).toHaveBeenCalledWith(jobEntity);
    });

    it('should throw if an error occurs in creation logic', async () => {
      const jobEntity = {
        id: faker.number.int(),
        status: JobStatus.PAID,
      } as JobEntity;

      (
        contentModerationRequestRepository.findByJobId as jest.Mock
      ).mockRejectedValueOnce(new Error('DB error'));

      await expect((service as any).ensureRequests(jobEntity)).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('processRequests', () => {
    it('should process all PENDING requests (success)', async () => {
      const jobEntity = { id: faker.number.int() } as JobEntity;
      const pendingRequest = {
        id: faker.number.int(),
      } as ContentModerationRequestEntity;

      jest
        .spyOn<any, any>(service, 'getRequests')
        .mockResolvedValueOnce([pendingRequest]);
      const processSingleRequestSpy = jest
        .spyOn<any, any>(service, 'processSingleRequest')
        .mockResolvedValueOnce(undefined);

      await (service as any).processRequests(jobEntity);
      expect(processSingleRequestSpy).toHaveBeenCalledWith(pendingRequest);
    });

    it('should mark request as FAILED if processSingleRequest throws', async () => {
      const jobEntity = { id: faker.number.int() } as JobEntity;
      const pendingRequest = {
        id: faker.number.int(),
      } as ContentModerationRequestEntity;

      jest
        .spyOn<any, any>(service, 'getRequests')
        .mockResolvedValueOnce([pendingRequest]);
      jest
        .spyOn<any, any>(service, 'processSingleRequest')
        .mockRejectedValueOnce(new Error('Processing error'));

      await (service as any).processRequests(jobEntity);

      expect(contentModerationRequestRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: pendingRequest.id,
          status: ContentModerationRequestStatus.FAILED,
        }),
      );
    });

    it('should throw if getRequests fails', async () => {
      const jobEntity = { id: faker.number.int() } as JobEntity;
      jest
        .spyOn<any, any>(service, 'getRequests')
        .mockRejectedValueOnce(new Error('getRequests error'));

      await expect((service as any).processRequests(jobEntity)).rejects.toThrow(
        'getRequests error',
      );
    });
  });

  describe('parseRequests', () => {
    it('should parse all PROCESSED requests (success)', async () => {
      const jobEntity = { id: faker.number.int() } as JobEntity;
      const processedRequest = {
        id: faker.number.int(),
      } as ContentModerationRequestEntity;

      jest
        .spyOn<any, any>(service, 'getRequests')
        .mockResolvedValueOnce([processedRequest]);
      const parseSingleRequestSpy = jest
        .spyOn<any, any>(service, 'parseSingleRequest')
        .mockResolvedValueOnce(undefined);

      await (service as any).parseRequests(jobEntity);
      expect(parseSingleRequestSpy).toHaveBeenCalledWith(processedRequest);
    });

    it('should mark request as FAILED if parseSingleRequest throws', async () => {
      const jobEntity = { id: faker.number.int() } as JobEntity;
      const processedRequest = {
        id: faker.number.int(),
      } as ContentModerationRequestEntity;

      jest
        .spyOn<any, any>(service, 'getRequests')
        .mockResolvedValueOnce([processedRequest]);
      jest
        .spyOn<any, any>(service, 'parseSingleRequest')
        .mockRejectedValueOnce(new Error('Parsing error'));

      await (service as any).parseRequests(jobEntity);
      expect(contentModerationRequestRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: processedRequest.id,
          status: ContentModerationRequestStatus.FAILED,
        }),
      );
    });

    it('should throw if getRequests fails', async () => {
      const jobEntity = { id: faker.number.int() } as JobEntity;
      jest
        .spyOn<any, any>(service, 'getRequests')
        .mockRejectedValueOnce(new Error('getRequests error'));

      await expect((service as any).parseRequests(jobEntity)).rejects.toThrow(
        'getRequests error',
      );
    });
  });

  describe('finalizeJob', () => {
    it('should do nothing if any requests are still PENDING or PROCESSED', async () => {
      const jobEntity = { id: faker.number.int() } as JobEntity;
      (
        contentModerationRequestRepository.findByJobId as jest.Mock
      ).mockResolvedValueOnce([
        { status: ContentModerationRequestStatus.PROCESSED },
      ]);

      await (service as any).finalizeJob(jobEntity);
      expect(jobRepository.updateOne).not.toHaveBeenCalled();
    });

    it('should set job to MODERATION_PASSED if all requests passed', async () => {
      const jobEntity = { id: faker.number.int() } as JobEntity;
      (
        contentModerationRequestRepository.findByJobId as jest.Mock
      ).mockResolvedValueOnce([
        { status: ContentModerationRequestStatus.PASSED },
        { status: ContentModerationRequestStatus.PASSED },
      ]);

      await (service as any).finalizeJob(jobEntity);
      expect(jobEntity.status).toBe(JobStatus.MODERATION_PASSED);
      expect(jobRepository.updateOne).toHaveBeenCalledWith(jobEntity);
    });

    it('should set job to POSSIBLE_ABUSE_IN_REVIEW if any request is flagged', async () => {
      const jobEntity = { id: faker.number.int() } as JobEntity;
      (
        contentModerationRequestRepository.findByJobId as jest.Mock
      ).mockResolvedValueOnce([
        { status: ContentModerationRequestStatus.POSITIVE_ABUSE },
      ]);

      await (service as any).finalizeJob(jobEntity);
      expect(jobEntity.status).toBe(JobStatus.POSSIBLE_ABUSE_IN_REVIEW);
      expect(jobRepository.updateOne).toHaveBeenCalledWith(jobEntity);
    });

    it('should throw if DB call fails', async () => {
      const jobEntity = { id: faker.number.int() } as JobEntity;
      (
        contentModerationRequestRepository.findByJobId as jest.Mock
      ).mockRejectedValueOnce(new Error('DB error'));

      await expect((service as any).finalizeJob(jobEntity)).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('processSingleRequest', () => {
    it('should slice valid files, call asyncBatchAnnotateImages, set status PROCESSED', async () => {
      const fakerBucket = faker.word.sample();
      const requestEntity: ContentModerationRequestEntity = {
        id: faker.number.int(),
        dataUrl: `https://${fakerBucket}.storage.googleapis.com`,
        from: 1,
        to: 2,
        job: { id: faker.number.int() } as JobEntity,
      } as any;

      const file1 = `${faker.word.sample()}.jpg`;
      const file2 = `${faker.word.sample()}.jpg`;
      const file3 = `${faker.word.sample()}.jpg`;
      jest
        .spyOn<any, any>(service, 'getValidFiles')
        .mockResolvedValueOnce([file1, file2, file3]);
      const asyncBatchSpy = jest
        .spyOn<any, any>(service, 'asyncBatchAnnotateImages')
        .mockResolvedValueOnce(undefined);

      await (service as any).processSingleRequest(requestEntity);

      expect(asyncBatchSpy).toHaveBeenCalledWith(
        [`gs://${fakerBucket}/${file1}`, `gs://${fakerBucket}/${file2}`],
        `moderation-results-${requestEntity.job.id}-${requestEntity.id}`,
      );
      expect(contentModerationRequestRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: requestEntity.id,
          status: ContentModerationRequestStatus.PROCESSED,
        }),
      );
    });

    it('should throw if asyncBatchAnnotateImages fails', async () => {
      const requestEntity: ContentModerationRequestEntity = {
        id: faker.number.int(),
        dataUrl: `https://${faker.word.sample()}.storage.googleapis.com`,
        from: 1,
        to: 2,
        job: { id: faker.number.int() } as JobEntity,
      } as any;

      jest
        .spyOn<any, any>(service, 'getValidFiles')
        .mockResolvedValueOnce([`${faker.word.sample()}.jpg`]);
      jest
        .spyOn<any, any>(service, 'asyncBatchAnnotateImages')
        .mockRejectedValueOnce(new Error('Vision error'));

      await expect(
        (service as any).processSingleRequest(requestEntity),
      ).rejects.toThrow('Vision error');
    });
  });

  describe('asyncBatchAnnotateImages', () => {
    it('should call visionClient.asyncBatchAnnotateImages successfully', async () => {
      const mockOperation = {
        promise: jest.fn().mockResolvedValueOnce([
          {
            outputConfig: { gcsDestination: { uri: faker.internet.url() } },
          },
        ]),
      };
      mockVisionClient.asyncBatchAnnotateImages.mockResolvedValueOnce([
        mockOperation,
      ]);

      await (service as any).asyncBatchAnnotateImages(
        ['img1', 'img2'],
        'my-file',
      );
      expect(mockVisionClient.asyncBatchAnnotateImages).toHaveBeenCalledWith(
        expect.objectContaining({ requests: expect.any(Array) }),
      );
    });

    it('should throw ControlledError if vision call fails', async () => {
      mockVisionClient.asyncBatchAnnotateImages.mockRejectedValueOnce(
        new Error('Vision failure'),
      );

      await expect(
        (service as any).asyncBatchAnnotateImages([], 'my-file'),
      ).rejects.toThrow(ControlledError);
    });
  });

  describe('parseSingleRequest', () => {
    it('should set POSITIVE_ABUSE if positiveAbuseResults found', async () => {
      const requestEntity: ContentModerationRequestEntity = {
        id: faker.number.int(),
        job: { id: faker.number.int() } as JobEntity,
      } as any;
      jest
        .spyOn<any, any>(service, 'collectModerationResults')
        .mockResolvedValueOnce({
          positiveAbuseResults: [{ imageUrl: 'abuse.jpg' }],
          possibleAbuseResults: [],
        });
      jest
        .spyOn<any, any>(service, 'handleAbuseLinks')
        .mockResolvedValueOnce(undefined);

      await (service as any).parseSingleRequest(requestEntity);
      expect(service['handleAbuseLinks']).toHaveBeenCalled();
      expect(requestEntity.status).toBe(
        ContentModerationRequestStatus.POSITIVE_ABUSE,
      );
      expect(contentModerationRequestRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ContentModerationRequestStatus.POSITIVE_ABUSE,
        }),
      );
    });

    it('should set POSSIBLE_ABUSE if possibleAbuseResults found', async () => {
      const requestEntity: ContentModerationRequestEntity = {
        id: faker.number.int(),
        job: { id: faker.number.int() } as JobEntity,
      } as any;
      jest
        .spyOn<any, any>(service, 'collectModerationResults')
        .mockResolvedValueOnce({
          positiveAbuseResults: [],
          possibleAbuseResults: [{ imageUrl: faker.internet.url() }],
        });
      jest
        .spyOn<any, any>(service, 'handleAbuseLinks')
        .mockResolvedValueOnce(undefined);

      await (service as any).parseSingleRequest(requestEntity);
      expect(service['handleAbuseLinks']).toHaveBeenCalled();
      expect(requestEntity.status).toBe(
        ContentModerationRequestStatus.POSSIBLE_ABUSE,
      );
    });

    it('should set PASSED if no abuse found', async () => {
      const requestEntity = {
        id: faker.number.int(),
        job: { id: faker.number.int() } as JobEntity,
      } as ContentModerationRequestEntity;
      jest
        .spyOn<any, any>(service, 'collectModerationResults')
        .mockResolvedValueOnce({
          positiveAbuseResults: [],
          possibleAbuseResults: [],
        });

      await (service as any).parseSingleRequest(requestEntity);
      expect(requestEntity.status).toBe(ContentModerationRequestStatus.PASSED);
      expect(contentModerationRequestRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ContentModerationRequestStatus.PASSED,
        }),
      );
    });

    it('should set FAILED if collectModerationResults throws', async () => {
      const requestEntity = {
        id: faker.number.int(),
        job: { id: faker.number.int() } as JobEntity,
      } as ContentModerationRequestEntity;
      jest
        .spyOn<any, any>(service, 'collectModerationResults')
        .mockRejectedValueOnce(new Error('Collect error'));

      await expect(
        (service as any).parseSingleRequest(requestEntity),
      ).rejects.toThrow('Collect error');
      expect(requestEntity.status).toBe(ContentModerationRequestStatus.FAILED);
    });
  });

  describe('collectModerationResults', () => {
    it('should throw ControlledError if no GCS files found', async () => {
      (mockStorage.bucket as any).mockReturnValueOnce({
        getFiles: jest.fn().mockResolvedValueOnce([]),
      });

      await expect(
        (service as any).collectModerationResults('some-file'),
      ).rejects.toThrow(ErrorContentModeration.NoResultsFound);
    });

    it('should parse each file and accumulate responses, then categorize', async () => {
      (mockStorage.bucket as any).mockReturnValueOnce({
        getFiles: jest.fn().mockResolvedValueOnce([
          [
            {
              name: `${faker.word.sample()}.json`,
              download: jest.fn().mockResolvedValueOnce([
                Buffer.from(
                  JSON.stringify({
                    responses: [
                      {
                        safeSearchAnnotation: {
                          adult: ContentModerationLevel.LIKELY,
                        },
                      },
                    ],
                  }),
                ),
              ]),
            },
            {
              name: `${faker.word.sample()}.json`,
              download: jest.fn().mockResolvedValueOnce([
                Buffer.from(
                  JSON.stringify({
                    responses: [
                      {
                        safeSearchAnnotation: {
                          violence: ContentModerationLevel.POSSIBLE,
                        },
                      },
                    ],
                  }),
                ),
              ]),
            },
          ],
        ]),
      });

      jest
        .spyOn<any, any>(service, 'categorizeModerationResults')
        .mockReturnValueOnce({
          positiveAbuseResults: [],
          possibleAbuseResults: [],
        });

      const result = await (service as any).collectModerationResults(
        faker.word.sample(),
      );
      expect((service as any).categorizeModerationResults).toHaveBeenCalledWith(
        expect.arrayContaining([
          { safeSearchAnnotation: { adult: ContentModerationLevel.LIKELY } },
          {
            safeSearchAnnotation: { violence: ContentModerationLevel.POSSIBLE },
          },
        ]),
      );
      expect(result).toHaveProperty('positiveAbuseResults');
      expect(result).toHaveProperty('possibleAbuseResults');
    });

    it('should throw ControlledError if an error occurs', async () => {
      (mockStorage.bucket as any).mockReturnValueOnce({
        getFiles: jest.fn().mockRejectedValueOnce(new Error('GCS error')),
      });

      await expect(
        (service as any).collectModerationResults(faker.word.sample()),
      ).rejects.toThrow(ErrorContentModeration.ResultsParsingFailed);
    });
  });

  describe('categorizeModerationResults', () => {
    it('should split results into positiveAbuse and possibleAbuse', () => {
      const responses = [
        {
          safeSearchAnnotation: { adult: ContentModerationLevel.LIKELY },
          context: {
            uri: `gs://${faker.word.sample({ length: { min: 5, max: 10 } })}/${faker.word.sample()}`,
          },
        },
        {
          safeSearchAnnotation: { violence: ContentModerationLevel.POSSIBLE },
          context: {
            uri: `gs://${faker.word.sample({ length: { min: 5, max: 10 } })}/${faker.word.sample()}`,
          },
        },
      ];
      const result = (service as any).categorizeModerationResults(responses);
      expect(result.positiveAbuseResults).toHaveLength(1);
      expect(result.possibleAbuseResults).toHaveLength(1);
    });

    it('should ignore entries with no safeSearchAnnotation', () => {
      const responses = [
        {
          safeSearchAnnotation: null,
          context: {
            uri: `gs://${faker.word.sample({ length: { min: 5, max: 10 } })}/${faker.word.sample()}`,
          },
        },
      ];
      const result = (service as any).categorizeModerationResults(responses);
      expect(result.positiveAbuseResults).toHaveLength(0);
      expect(result.possibleAbuseResults).toHaveLength(0);
    });
  });

  describe('handleAbuseLinks', () => {
    it('should upload text file and send Slack message for confirmed abuse', async () => {
      const mockSignedUrl = faker.internet.url();
      (mockStorage.bucket as any).mockReturnValueOnce({
        file: jest.fn().mockReturnValueOnce({
          createWriteStream: jest.fn(() => ({ end: jest.fn() })),
          getSignedUrl: jest.fn().mockResolvedValueOnce([mockSignedUrl]),
        }),
      });

      await (service as any).handleAbuseLinks(
        [faker.internet.url()],
        faker.word.sample(),
        faker.number.int(),
        faker.number.int(),
        true,
      );
      expect(sendSlackNotification).toHaveBeenCalledWith(
        slackConfigService.abuseNotificationWebhookUrl,
        expect.stringContaining(mockSignedUrl),
      );
    });

    it('should handle possible abuse similarly', async () => {
      const mockSignedUrl = faker.internet.url();
      (mockStorage.bucket as any).mockReturnValueOnce({
        file: jest.fn().mockReturnValueOnce({
          createWriteStream: jest.fn(() => ({ end: jest.fn() })),
          getSignedUrl: jest.fn().mockResolvedValueOnce([mockSignedUrl]),
        }),
      });

      await (service as any).handleAbuseLinks(
        [faker.internet.url()],
        faker.word.sample(),
        faker.number.int(),
        faker.number.int(),
        false,
      );
      expect(sendSlackNotification).toHaveBeenCalledWith(
        slackConfigService.abuseNotificationWebhookUrl,
        expect.stringContaining(mockSignedUrl),
      );
    });

    it('should throw if getSignedUrl fails', async () => {
      (mockStorage.bucket as any).mockReturnValueOnce({
        file: jest.fn().mockReturnValueOnce({
          createWriteStream: jest.fn(() => ({ end: jest.fn() })),
          getSignedUrl: jest
            .fn()
            .mockRejectedValueOnce(new Error('Signed URL error')),
        }),
      });

      await expect(
        (service as any).handleAbuseLinks(
          [],
          faker.word.sample(),
          faker.number.int(),
          faker.number.int(),
          true,
        ),
      ).rejects.toThrow('Signed URL error');
    });
  });

  describe('getRequests', () => {
    it('should return from jobEntity if loaded', async () => {
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
    });

    it('should fallback to DB if not in memory', async () => {
      const jobEntity = { id: faker.number.int() } as JobEntity;
      (
        contentModerationRequestRepository.findByJobIdAndStatus as jest.Mock
      ).mockResolvedValueOnce([
        { status: ContentModerationRequestStatus.PROCESSED },
      ]);

      const result = await (service as any).getRequests(
        jobEntity,
        ContentModerationRequestStatus.PROCESSED,
      );
      expect(
        contentModerationRequestRepository.findByJobIdAndStatus,
      ).toHaveBeenCalledWith(
        jobEntity.id,
        ContentModerationRequestStatus.PROCESSED,
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('getValidFiles', () => {
    it('should return cached files if present', async () => {
      const dataUrl = `gs://${faker.word.sample({ length: { min: 5, max: 10 } })}/data`;
      const file1 = `${faker.word.sample()}.jpg`;
      const file2 = `${faker.word.sample()}.png`;
      (service as any).bucketListCache.set(dataUrl, [file1, file2]);

      const result = await (service as any).getValidFiles(dataUrl);
      expect(result).toEqual([file1, file2]);
      expect(listObjectsInBucket).not.toHaveBeenCalled();
    });

    it('should fetch from GCS if not cached, filter out directories, and cache', async () => {
      const dataUrl = `gs://${faker.word.sample({ length: { min: 5, max: 10 } })}/data`;
      const file1 = `${faker.word.sample()}.jpg`;
      const file2 = `${faker.word.sample()}.png`;
      (listObjectsInBucket as jest.Mock).mockResolvedValueOnce([
        file1,
        'subdir/',
        file2,
      ]);

      const result = await (service as any).getValidFiles(dataUrl);
      expect(result).toEqual([file1, file2]);

      expect((service as any).bucketListCache.get(dataUrl)).toEqual(result);
    });

    it('should throw if listObjectsInBucket fails', async () => {
      const dataUrl = `gs://${faker.word.sample({ length: { min: 5, max: 10 } })}/fail`;
      (listObjectsInBucket as jest.Mock).mockRejectedValueOnce(
        new Error('List objects error'),
      );

      await expect((service as any).getValidFiles(dataUrl)).rejects.toThrow(
        'List objects error',
      );
    });
  });
});
