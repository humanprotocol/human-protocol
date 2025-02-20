import { Storage } from '@google-cloud/storage';
import { ImageAnnotatorClient, protos } from '@google-cloud/vision';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { SlackConfigService } from '../../common/config/slack-config.service';
import { VisionConfigService } from '../../common/config/vision-config.service';
import {
  GCV_CONTENT_MODERATION_ASYNC_BATCH_SIZE,
  GCV_CONTENT_MODERATION_BATCH_SIZE_PER_TASK,
} from '../../common/constants';
import { ErrorContentModeration } from '../../common/constants/errors';
import {
  ContentModerationFeature,
  ContentModerationLevel,
  ContentModerationRequestStatus,
} from '../../common/enums/content-moderation';
import { JobStatus } from '../../common/enums/job';
import { ControlledError } from '../../common/errors/controlled';
import { hashString } from '../../common/utils';
import {
  constructGcsPath,
  convertToGCSPath,
  convertToHttpUrl,
  isGCSBucketUrl,
} from '../../common/utils/gcstorage';
import {
  checkModerationLevels,
  getFileName,
} from '../../common/utils/job-moderation';
import { sendSlackNotification } from '../../common/utils/slack';
import { listObjectsInBucket } from '../../common/utils/storage';
import { JobEntity } from '../job/job.entity';
import { JobRepository } from '../job/job.repository';
import { StorageService } from '../storage/storage.service';
import { ContentModerationRequestEntity } from './content-moderation-request.entity';
import { ContentModerationRequestRepository } from './content-moderation-request.repository';
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
  private bucketListCache = new Map<string, string[]>();

  constructor(
    private readonly jobRepository: JobRepository,
    private readonly contentModerationRequestRepository: ContentModerationRequestRepository,
    private readonly visionConfigService: VisionConfigService,
    private readonly slackConfigService: SlackConfigService,
    private readonly storageService: StorageService,
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
  }

  /**
   * Single public method orchestrating all steps in order
   */
  public async moderateJob(jobEntity: JobEntity): Promise<void> {
    await this.ensureRequests(jobEntity);
    await this.processRequests(jobEntity);
    await this.parseRequests(jobEntity);
    await this.finalizeJob(jobEntity);
  }

  /**
   * 1) If no requests exist for this job, create them in PENDING.
   */
  private async ensureRequests(jobEntity: JobEntity): Promise<void> {
    const existing = await this.contentModerationRequestRepository.findByJobId(
      jobEntity.id,
    );
    if (existing.length > 0) return;

    if (
      jobEntity.status !== JobStatus.PAID &&
      jobEntity.status !== JobStatus.UNDER_MODERATION
    ) {
      return;
    }

    try {
      const manifest: any = await this.storageService.downloadJsonLikeData(
        jobEntity.manifestUrl,
      );
      const dataUrl = manifest?.data?.data_url;

      if (!dataUrl || !isGCSBucketUrl(dataUrl)) {
        jobEntity.status = JobStatus.MODERATION_PASSED;
        await this.jobRepository.updateOne(jobEntity);
        return;
      }

      const validFiles = await this.getValidFiles(dataUrl);
      if (validFiles.length === 0) return;

      const batchSize = GCV_CONTENT_MODERATION_BATCH_SIZE_PER_TASK;
      const newRequests: ContentModerationRequestEntity[] = [];

      for (let i = 0; i < validFiles.length; i += batchSize) {
        newRequests.push(
          Object.assign(new ContentModerationRequestEntity(), {
            dataUrl,
            from: i + 1,
            to: Math.min(i + batchSize, validFiles.length),
            status: ContentModerationRequestStatus.PENDING,
            job: jobEntity,
          }),
        );
      }

      jobEntity.contentModerationRequests = [
        ...(jobEntity.contentModerationRequests || []),
        ...newRequests,
      ];
      jobEntity.status = JobStatus.UNDER_MODERATION;
      await this.jobRepository.updateOne(jobEntity);
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
  private async processRequests(jobEntity: JobEntity): Promise<void> {
    try {
      const requests = await this.getRequests(
        jobEntity,
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
  private async parseRequests(jobEntity: JobEntity): Promise<void> {
    try {
      const requests = await this.getRequests(
        jobEntity,
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
          req.status === ContentModerationRequestStatus.POSITIVE_ABUSE ||
          req.status === ContentModerationRequestStatus.POSSIBLE_ABUSE
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

    const fileName = getFileName(
      'moderation-results',
      requestEntity.job.id.toString(),
      requestEntity.id.toString(),
    );

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
    const requests = imageUrls.map((url) => ({
      image: { source: { imageUri: url } },
      features: [{ type: ContentModerationFeature.SAFE_SEARCH_DETECTION }],
    }));

    const outputUri = constructGcsPath(
      this.visionConfigService.moderationResultsBucket,
      this.visionConfigService.moderationResultsFilesPath,
      hashString(fileName),
    );

    const requestPayload = {
      requests,
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
      throw new ControlledError(
        ErrorContentModeration.ContentModerationFailed,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Parse a single PROCESSED request => sets it to PASSED, POSSIBLE_ABUSE, or POSITIVE_ABUSE
   */
  private async parseSingleRequest(
    requestEntity: ContentModerationRequestEntity,
  ): Promise<void> {
    try {
      const fileName = getFileName(
        'moderation-results',
        requestEntity.job.id.toString(),
        requestEntity.id.toString(),
      );
      const moderationResults = await this.collectModerationResults(fileName);

      if (moderationResults.positiveAbuseResults.length > 0) {
        await this.handleAbuseLinks(
          moderationResults.positiveAbuseResults.map((r) => r.imageUrl),
          fileName,
          requestEntity.id,
          requestEntity.job.id,
          true,
        );
        requestEntity.abuseReason = 'Flagged for abusive content.';
        requestEntity.status = ContentModerationRequestStatus.POSITIVE_ABUSE;
      } else if (moderationResults.possibleAbuseResults.length > 0) {
        await this.handleAbuseLinks(
          moderationResults.possibleAbuseResults.map((r) => r.imageUrl),
          fileName,
          requestEntity.id,
          requestEntity.job.id,
          false,
        );
        requestEntity.abuseReason = 'Flagged for possible abuse.';
        requestEntity.status = ContentModerationRequestStatus.POSSIBLE_ABUSE;
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
      const hash = hashString(fileName);
      const bucketPrefix = `${this.visionConfigService.moderationResultsFilesPath}/${hash}`;
      const bucketName = this.visionConfigService.moderationResultsBucket;
      const bucket = this.storage.bucket(bucketName);

      const [files] = await bucket.getFiles({ prefix: bucketPrefix });
      if (!files || files.length === 0) {
        throw new ControlledError(
          ErrorContentModeration.NoResultsFound,
          HttpStatus.NOT_FOUND,
        );
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
      this.logger.error('Error collecting moderation results:', err);
      throw new ControlledError(
        ErrorContentModeration.ResultsParsingFailed,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Splits the annotated results into "positiveAbuse" and "possibleAbuse"
   */
  private categorizeModerationResults(
    results: protos.google.cloud.vision.v1.IAnnotateImageResponse[],
  ) {
    const finalResults = results.reduce(
      (acc, response) => {
        const safeSearch = response.safeSearchAnnotation;
        if (!safeSearch) return acc;
        const imageUrl = convertToHttpUrl(response.context?.uri ?? '');
        acc.push({
          imageUrl,
          moderationResult: {
            adult: safeSearch.adult,
            violence: safeSearch.violence,
            racy: safeSearch.racy,
            spoof: safeSearch.spoof,
            medical: safeSearch.medical,
          },
        });
        return acc;
      },
      [] as Array<{ imageUrl: string; moderationResult: any }>,
    );

    const positiveAbuseResults = finalResults.filter((r) =>
      checkModerationLevels(r.moderationResult, [
        ContentModerationLevel.VERY_LIKELY,
        ContentModerationLevel.LIKELY,
      ]),
    );
    const possibleAbuseResults = finalResults.filter((r) =>
      checkModerationLevels(r.moderationResult, [
        ContentModerationLevel.POSSIBLE,
      ]),
    );
    return { positiveAbuseResults, possibleAbuseResults };
  }

  /**
   * Uploads a small text file listing the abuse-related images, then sends Slack notification
   */
  private async handleAbuseLinks(
    imageLinks: string[],
    fileName: string,
    requestId: number,
    jobId: number,
    isConfirmedAbuse: boolean,
  ): Promise<void> {
    const bucketName = this.visionConfigService.moderationResultsBucket;
    const resultsFileName = `${fileName}.txt`;
    const file = this.storage.bucket(bucketName).file(resultsFileName);
    const stream = file.createWriteStream({ resumable: false });
    stream.end(imageLinks.join('\n'));

    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 24 * 1000,
    });
    const consoleUrl = `https://console.cloud.google.com/storage/browser/${bucketName}?prefix=${resultsFileName}`;
    const message = isConfirmedAbuse
      ? `Images contain abusive content. Request ${requestId}, job ${jobId}.\n\n**Results File:** <${signedUrl}|Download Here>\n**Google Cloud Console:** <${consoleUrl}|View in Console>\n\nEnsure you download the file before the link expires, or access it directly via GCS.`
      : `Images have possible abuse. Request ${requestId}, job ${jobId}.\n\n**Results File:** <${signedUrl}|Download Here>\n**Google Cloud Console:** <${consoleUrl}|View in Console>\n\nEnsure you download the file before the link expires, or access it directly via GCS.`;

    await sendSlackNotification(
      this.slackConfigService.abuseNotificationWebhookUrl,
      message,
    );
  }

  /**
   * Helper to retrieve requests from memory if loaded, or from DB if not
   */
  private async getRequests(
    jobEntity: JobEntity,
    status: ContentModerationRequestStatus,
  ): Promise<ContentModerationRequestEntity[]> {
    if (jobEntity.contentModerationRequests?.length) {
      return jobEntity.contentModerationRequests.filter(
        (r) => r.status === status,
      );
    }

    return this.contentModerationRequestRepository.findByJobIdAndStatus(
      jobEntity.id,
      status,
    );
  }

  /**
   * Caches GCS object listings so we don't repeatedly call listObjectsInBucket for the same dataUrl
   */
  private async getValidFiles(dataUrl: string): Promise<string[]> {
    if (this.bucketListCache.has(dataUrl)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.bucketListCache.get(dataUrl)!;
    }
    const allFiles = await listObjectsInBucket(new URL(dataUrl));
    const validFiles = allFiles.filter((f) => f && !f.endsWith('/'));
    this.bucketListCache.set(dataUrl, validFiles);
    return validFiles;
  }
}
