import { Storage } from '@google-cloud/storage';
import { ImageAnnotatorClient, protos } from '@google-cloud/vision';
import { Injectable, Logger } from '@nestjs/common';
import NodeCache from 'node-cache';
import { SlackConfigService } from '../../common/config/slack-config.service';
import { VisionConfigService } from '../../common/config/vision-config.service';
import {
  GCV_CONTENT_MODERATION_ASYNC_BATCH_SIZE,
  GCV_CONTENT_MODERATION_BATCH_SIZE_PER_TASK,
} from '../../common/constants';
import { ErrorContentModeration } from '../../common/constants/errors';
import { ContentModerationRequestStatus } from '../../common/enums/content-moderation';
import {
  ContentModerationFeature,
  ContentModerationLevel,
} from '../../common/enums/gcv';
import { JobStatus } from '../../common/enums/job';
import {
  constructGcsPath,
  convertToGCSPath,
  convertToHttpUrl,
  isGCSBucketUrl,
} from '../../common/utils/gcstorage';
import { sendSlackNotification } from '../../common/utils/slack';
import { listObjectsInBucket } from '../../common/utils/storage';
import { JobEntity } from '../job/job.entity';
import { JobRepository } from '../job/job.repository';
import { CvatManifestDto } from '../manifest/manifest.dto';
import { ManifestService } from '../manifest/manifest.service';
import { ContentModerationRequestEntity } from './content-moderation-request.entity';
import { ContentModerationRequestRepository } from './content-moderation-request.repository';
import { ModerationResultDto } from './content-moderation.dto';
import { IContentModeratorService } from './content-moderation.interface';

@Injectable()
export class GCVContentModerationService implements IContentModeratorService {
  private readonly logger = new Logger(GCVContentModerationService.name);

  private visionClient: ImageAnnotatorClient;
  private storage: Storage;

  /**
   * Cache of GCS object listings by dataUrl
   * Key: dataUrl string, Value: array of valid file names
   */
  private bucketListCache: NodeCache;

  constructor(
    private readonly jobRepository: JobRepository,
    private readonly contentModerationRequestRepository: ContentModerationRequestRepository,
    private readonly visionConfigService: VisionConfigService,
    private readonly slackConfigService: SlackConfigService,
    private readonly manifestService: ManifestService,
  ) {
    this.visionClient = new ImageAnnotatorClient({
      projectId: this.visionConfigService.projectId,
      credentials: {
        private_key: this.visionConfigService.privateKey,
        client_email: this.visionConfigService.clientEmail,
      },
    });

    this.storage = new Storage({
      projectId: this.visionConfigService.projectId,
      credentials: {
        private_key: this.visionConfigService.privateKey,
        client_email: this.visionConfigService.clientEmail,
      },
    });

    // Initialize cache with expiration time of 60 minutes and check period of 15 minutes
    this.bucketListCache = new NodeCache({
      stdTTL: 30 * 60,
      checkperiod: 15 * 60,
    });
  }

  /**
   * Single public method orchestrating all steps in order
   */
  public async moderateJob(jobEntity: JobEntity): Promise<void> {
    await this.createModerationRequests(jobEntity);
    await this.processModerationRequests(jobEntity);
    await this.parseModerationRequests(jobEntity);
    await this.finalizeJob(jobEntity);
  }

  /**
   * 1) If no requests exist for this job, create them in PENDING.
   */
  private async createModerationRequests(jobEntity: JobEntity): Promise<void> {
    if (
      jobEntity.status !== JobStatus.PAID &&
      jobEntity.status !== JobStatus.UNDER_MODERATION
    ) {
      return;
    }

    try {
      const manifest = (await this.manifestService.downloadManifest(
        jobEntity.manifestUrl,
        jobEntity.requestType,
      )) as CvatManifestDto;
      const dataUrl = manifest?.data?.data_url;

      if (!dataUrl || !isGCSBucketUrl(dataUrl)) {
        jobEntity.status = JobStatus.MODERATION_PASSED;
        await this.jobRepository.updateOne(jobEntity);
        return;
      }

      const validFiles = await this.getValidFiles(dataUrl);
      if (validFiles.length === 0) return;

      const existingRequests =
        await this.contentModerationRequestRepository.findByJobId(jobEntity.id);

      const newRequests: ContentModerationRequestEntity[] = [];

      for (
        let i = 0;
        i < validFiles.length;
        i += GCV_CONTENT_MODERATION_BATCH_SIZE_PER_TASK
      ) {
        const from = i + 1;
        const to = Math.min(
          i + GCV_CONTENT_MODERATION_BATCH_SIZE_PER_TASK,
          validFiles.length,
        );

        const request = existingRequests.some(
          (req) => req.from === from && req.to === to,
        );

        if (!request) {
          newRequests.push(
            Object.assign(new ContentModerationRequestEntity(), {
              dataUrl,
              from,
              to,
              status: ContentModerationRequestStatus.PENDING,
              job: jobEntity,
            }),
          );
        }
      }

      if (newRequests.length > 0) {
        jobEntity.contentModerationRequests = [
          ...(jobEntity.contentModerationRequests || []),
          ...newRequests,
        ];
        jobEntity.status = JobStatus.UNDER_MODERATION;
        await this.jobRepository.updateOne(jobEntity);
      }
    } catch (err) {
      this.logger.error(
        `Error creating requests for job ${jobEntity.id}: ${err.message}`,
      );
      throw err;
    }
  }

  /**
   * 2) Process all PENDING requests -> call GCV. Mark them PROCESSED if success.
   *    Parallelized with Promise.all for performance.
   */
  private async processModerationRequests(jobEntity: JobEntity): Promise<void> {
    try {
      const requests =
        await this.contentModerationRequestRepository.findByJobIdAndStatus(
          jobEntity.id,
          ContentModerationRequestStatus.PENDING,
        );
      await Promise.all(
        requests.map(async (requestEntity) => {
          try {
            await this.processSingleRequest(requestEntity);
          } catch (err) {
            this.logger.error(
              `Error processing request ${requestEntity.id} (job ${jobEntity.id}): ${err.message}`,
            );
            requestEntity.status = ContentModerationRequestStatus.FAILED;
            await this.contentModerationRequestRepository.updateOne(
              requestEntity,
            );
          }
        }),
      );
    } catch (err) {
      this.logger.error(
        `Error processing requests for job ${jobEntity.id}: ${err.message}`,
      );
      throw err;
    }
  }

  /**
   * 3) Parse results for requests in PROCESSED -> set to PASSED, POSSIBLE_ABUSE, or POSITIVE_ABUSE
   *    Also parallelized with Promise.all.
   */
  private async parseModerationRequests(jobEntity: JobEntity): Promise<void> {
    try {
      const requests =
        await this.contentModerationRequestRepository.findByJobIdAndStatus(
          jobEntity.id,
          ContentModerationRequestStatus.PROCESSED,
        );

      await Promise.all(
        requests.map(async (requestEntity) => {
          try {
            await this.parseSingleRequest(requestEntity);
          } catch (err) {
            this.logger.error(
              `Error parsing request ${requestEntity.id} for job ${jobEntity.id}: ${err.message}`,
            );
            requestEntity.status = ContentModerationRequestStatus.FAILED;
            await this.contentModerationRequestRepository.updateOne(
              requestEntity,
            );
          }
        }),
      );
    } catch (err) {
      this.logger.error(
        `Error parsing results for job ${jobEntity.id}: ${err.message}`,
      );
      throw err;
    }
  }

  /**
   * 4) If all requests are done, set job to MODERATION_PASSED or POSSIBLE_ABUSE_IN_REVIEW
   */
  private async finalizeJob(jobEntity: JobEntity): Promise<void> {
    try {
      // We'll try to use the jobEntity if it has requests loaded. Otherwise, fallback to DB.
      const allRequests = jobEntity.contentModerationRequests?.length
        ? jobEntity.contentModerationRequests
        : await this.contentModerationRequestRepository.findByJobId(
            jobEntity.id,
          );

      const incomplete = allRequests.some(
        (r) =>
          r.status === ContentModerationRequestStatus.PENDING ||
          r.status === ContentModerationRequestStatus.PROCESSED,
      );
      if (incomplete) return;

      let allPassed = true;
      for (const req of allRequests) {
        if (
          req.status === ContentModerationRequestStatus.FAILED ||
          req.status === ContentModerationRequestStatus.POSITIVE_ABUSE
        ) {
          allPassed = false;
        }
      }

      if (allPassed) {
        jobEntity.status = JobStatus.MODERATION_PASSED;
        await this.jobRepository.updateOne(jobEntity);
      } else {
        jobEntity.status = JobStatus.POSSIBLE_ABUSE_IN_REVIEW;
        await this.jobRepository.updateOne(jobEntity);
      }
    } catch (err) {
      this.logger.error(`Error finalizing job ${jobEntity.id}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Actually calls GCV. Mark requestEntity => PROCESSED on success.
   */
  private async processSingleRequest(
    requestEntity: ContentModerationRequestEntity,
  ): Promise<void> {
    const validFiles = await this.getValidFiles(requestEntity.dataUrl);
    const filesToProcess = validFiles.slice(
      requestEntity.from - 1,
      requestEntity.to,
    );
    const gcDataUrl = convertToGCSPath(requestEntity.dataUrl);
    const imageUrls = filesToProcess.map(
      (fileName) => `${gcDataUrl}/${fileName.split('/').pop()}`,
    );

    const fileName = `moderation-results-${requestEntity.job.id}-${requestEntity.id}`;

    await this.asyncBatchAnnotateImages(imageUrls, fileName);

    requestEntity.status = ContentModerationRequestStatus.PROCESSED;
    await this.contentModerationRequestRepository.updateOne(requestEntity);
  }

  /**
   * Calls GCV's asyncBatchAnnotateImages with SAFE_SEARCH_DETECTION
   */
  private async asyncBatchAnnotateImages(
    imageUrls: string[],
    fileName: string,
  ): Promise<void> {
    const request = imageUrls.map((url) => ({
      image: { source: { imageUri: url } },
      features: [{ type: ContentModerationFeature.SAFE_SEARCH_DETECTION }],
    }));

    const outputUri = constructGcsPath(
      this.visionConfigService.moderationResultsBucket,
      this.visionConfigService.moderationResultsFilesPath,
      fileName + '-',
    );

    const requestPayload: protos.google.cloud.vision.v1.IAsyncBatchAnnotateImagesRequest =
      {
        requests: request,
        outputConfig: {
          gcsDestination: { uri: outputUri },
          batchSize: GCV_CONTENT_MODERATION_ASYNC_BATCH_SIZE,
        },
      };

    try {
      const [operation] =
        await this.visionClient.asyncBatchAnnotateImages(requestPayload);
      const [filesResponse] = await operation.promise();
      this.logger.log(
        `Output written to GCS: ${filesResponse?.outputConfig?.gcsDestination?.uri}`,
      );
    } catch (error) {
      this.logger.error('Error analyzing images:', error);
      throw new Error(ErrorContentModeration.ContentModerationFailed);
    }
  }

  /**
   * Parse a single PROCESSED request => sets it to PASSED or POSITIVE_ABUSE
   */
  private async parseSingleRequest(
    requestEntity: ContentModerationRequestEntity,
  ): Promise<void> {
    try {
      const fileName = `moderation-results-${requestEntity.job.id}-${requestEntity.id}`;
      const moderationResults = await this.collectModerationResults(fileName);

      if (moderationResults.length > 0) {
        await this.handleAbuseLinks(
          moderationResults,
          fileName,
          requestEntity.id,
          requestEntity.job.id,
        );
        requestEntity.status = ContentModerationRequestStatus.POSITIVE_ABUSE;
      } else {
        requestEntity.status = ContentModerationRequestStatus.PASSED;
      }
    } catch (err) {
      requestEntity.status = ContentModerationRequestStatus.FAILED;
      throw err;
    }
    await this.contentModerationRequestRepository.updateOne(requestEntity);
  }

  /**
   * Downloads GCS results, categorizes them into positiveAbuse / possibleAbuse
   */
  private async collectModerationResults(fileName: string) {
    try {
      const bucketPrefix = `${this.visionConfigService.moderationResultsFilesPath}/${fileName}`;
      const bucketName = this.visionConfigService.moderationResultsBucket;
      const bucket = this.storage.bucket(bucketName);

      const [files] = await bucket.getFiles({ prefix: bucketPrefix });
      if (!files || files.length === 0) {
        throw new Error(ErrorContentModeration.NoResultsFound);
      }

      const allResponses = [];
      for (const file of files) {
        const [content] = await file.download();
        const jsonString = content.toString('utf-8');
        const parsed = JSON.parse(jsonString);

        if (Array.isArray(parsed.responses)) {
          allResponses.push(...parsed.responses);
        }
      }
      return this.categorizeModerationResults(allResponses);
    } catch (err) {
      if (err.message === ErrorContentModeration.NoResultsFound) {
        throw err;
      }
      this.logger.error('Error collecting moderation results:', err);
      throw new Error(ErrorContentModeration.ResultsParsingFailed);
    }
  }

  /**
   * Processes the results from the Google Cloud Vision API and categorizes them based on moderation levels
   */
  private categorizeModerationResults(
    results: protos.google.cloud.vision.v1.IAnnotateImageResponse[],
  ) {
    const relevantLevels = [
      ContentModerationLevel.VERY_LIKELY,
      ContentModerationLevel.LIKELY,
      ContentModerationLevel.POSSIBLE,
    ];

    return results
      .map((response) => {
        const safeSearch = response.safeSearchAnnotation as ModerationResultDto;
        if (!safeSearch) return null;

        const imageUrl = convertToHttpUrl(response.context?.uri ?? '');

        const flaggedCategory = Object.keys(new ModerationResultDto()).find(
          (field) =>
            relevantLevels.includes(
              safeSearch[
                field as keyof ModerationResultDto
              ] as ContentModerationLevel,
            ),
        );

        if (!flaggedCategory) {
          return null;
        }

        return {
          imageUrl,
          moderationResult: flaggedCategory,
        };
      })

      .filter(
        (item): item is { imageUrl: string; moderationResult: string } =>
          !!item,
      );
  }

  /**
   * Uploads a small text file listing the abuse-related images, then sends Slack notification
   */
  private async handleAbuseLinks(
    images: {
      imageUrl: string;
      moderationResult: string;
    }[],
    fileName: string,
    requestId: number,
    jobId: number,
  ): Promise<void> {
    const bucketName = this.visionConfigService.moderationResultsBucket;
    const resultsFileName = `${fileName}.txt`;
    const file = this.storage.bucket(bucketName).file(resultsFileName);
    const stream = file.createWriteStream({ resumable: false });
    stream.end(JSON.stringify(images));

    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 24 * 1000,
    });
    const consoleUrl = `https://console.cloud.google.com/storage/browser/${bucketName}?prefix=${resultsFileName}`;
    const message = `Images may contain abusive content. Request ${requestId}, job ${jobId}.\n\n**Results File:** <${signedUrl}|Download Here>\n**Google Cloud Console:** <${consoleUrl}|View in Console>\n\nEnsure you download the file before the link expires, or access it directly via GCS.`;

    await sendSlackNotification(
      this.slackConfigService.abuseNotificationWebhookUrl,
      message,
    );
  }

  /**
   * Caches GCS object listings so we don't repeatedly call listObjectsInBucket for the same dataUrl
   */
  private async getValidFiles(dataUrl: string): Promise<string[]> {
    const cacheEntry = this.bucketListCache.get<string[]>(dataUrl);
    if (cacheEntry) {
      return cacheEntry;
    }

    const allFiles = await listObjectsInBucket(new URL(dataUrl));
    const validFiles = allFiles.filter((f) => f && !f.endsWith('/'));
    this.bucketListCache.set(dataUrl, validFiles);

    return validFiles;
  }
}
