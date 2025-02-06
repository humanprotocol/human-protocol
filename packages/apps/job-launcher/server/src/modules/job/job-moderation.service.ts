import { ImageAnnotatorClient, protos } from '@google-cloud/vision';
import { Storage } from '@google-cloud/storage';
import { VisionConfigService } from '../../common/config/vision-config.service';
import { ErrorJobModeration } from '../../common/constants/errors';
import { listObjectsInBucket } from '../../common/utils/storage';
import {
  constructGcsPath,
  convertToGCSPath,
  convertToHttpUrl,
  isGCSBucketUrl,
} from '../../common/utils/gcstorage';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  CONTENT_MODERATION_FEATURE,
  CONTENT_MODERATION_LEVEL,
  JOB_MODERATION_ASYNC_BATCH_SIZE,
} from '../../common/constants';
import {
  DataModerationResultDto,
  ImageModerationResultDto,
} from './job-moderation.dto';
import { ControlledError } from '../../common/errors/controlled';
import { StorageService } from '../storage/storage.service';
import { SlackConfigService } from '../../common/config/slack-config.service';
import { sendSlackNotification } from '../../common/utils/slack';
import { JobEntity } from './job.entity';
import { JobRepository } from './job.repository';
import { JobModerationTaskStatus, JobStatus } from '../../common/enums/job';
import { hashString } from '../../common/utils';
import {
  checkModerationLevels,
  getFileName,
} from '../../common/utils/job-moderation';
import { JobModerationTaskEntity } from './job-moderation-task.entity';
import { JobModerationTaskRepository } from './job-moderation-task.repository';

@Injectable()
export class JobModerationService {
  private visionClient: ImageAnnotatorClient;
  private storage: Storage;
  public readonly logger = new Logger(JobModerationService.name);

  constructor(
    private readonly jobRepository: JobRepository,
    private readonly jobModerationTaskRepository: JobModerationTaskRepository,
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

  public async jobModeration(jobEntity: JobEntity): Promise<JobEntity> {
    const manifest: any = await this.storageService.downloadJsonLikeData(
      jobEntity.manifestUrl,
    );

    const dataUrl = manifest.data.data_url;
    if (!isGCSBucketUrl(dataUrl)) {
      throw new Error(ErrorJobModeration.DataMustBeStoredInGCS);
    }

    const dataFiles = await listObjectsInBucket(new URL(dataUrl));
    const validFiles = dataFiles.filter(
      (fileName) => fileName && !fileName.endsWith('/'),
    );

    const batchSize = JOB_MODERATION_ASYNC_BATCH_SIZE;
    const batches = [];

    // Split the files into batches of 2000
    for (let i = 0; i < validFiles.length; i += batchSize) {
      batches.push(validFiles.slice(i, i + batchSize));
    }

    // Create tasks for each batch
    const tasksToCreate = [];
    for (let i = 0; i < batches.length; i++) {
      const jobModerationTaskEntity = new JobModerationTaskEntity();
      jobModerationTaskEntity.jobId = jobEntity.id;
      jobModerationTaskEntity.dataUrl = dataUrl;
      jobModerationTaskEntity.from = i * batchSize + 1; // Start index for the batch
      jobModerationTaskEntity.to = Math.min(
        (i + 1) * batchSize,
        validFiles.length,
      ); // End index for the batch
      jobModerationTaskEntity.status = JobModerationTaskStatus.PENDING;

      tasksToCreate.push(jobModerationTaskEntity);
    }

    // Bulk insert tasks
    await this.jobModerationTaskRepository.save(tasksToCreate);

    jobEntity.status = JobStatus.UNDER_MODERATION;
    await this.jobRepository.updateOne(jobEntity);
    return jobEntity;
  }

  public async parseJobModerationResults(
    jobModerationTask: JobModerationTaskEntity,
  ): Promise<JobModerationTaskEntity> {
    try {
      const fileName = getFileName(
        jobModerationTask.dataUrl,
        jobModerationTask.jobId.toString(),
        jobModerationTask.id.toString(),
      );

      const moderationResults = await this.collectModerationResults(fileName);

      if (moderationResults.positiveAbuseResults.length > 0) {
        const abusiveImageLinks = moderationResults.positiveAbuseResults.map(
          (result) => result.imageUrl,
        );
        await this.handleAbuseLinks(
          abusiveImageLinks,
          jobModerationTask.id,
          jobModerationTask.jobId,
          true,
        );

        this.logger.error(
          `Job ${jobModerationTask.jobId} failed due to abusive content.`,
        );

        jobModerationTask.abuseReason = `Job flagged for review due to detected abusive content. See the detailed report.`;
        jobModerationTask.status = JobModerationTaskStatus.POSITIVE_ABUSE;
      } else if (moderationResults.possibleAbuseResults.length > 0) {
        const possibleAbuseLinks = moderationResults.possibleAbuseResults.map(
          (result) => result.imageUrl,
        );
        await this.handleAbuseLinks(
          possibleAbuseLinks,
          jobModerationTask.id,
          jobModerationTask.jobId,
          false,
        );

        jobModerationTask.abuseReason = `Job flagged for review due to possible moderation concerns. See the detailed report.`;
        jobModerationTask.status = JobModerationTaskStatus.POSSIBLE_ABUSE;
      } else {
        jobModerationTask.status = JobModerationTaskStatus.PASSED;
      }
    } catch (error) {
      this.logger.error('Error parsing job moderation results:', error);
      jobModerationTask.status = JobModerationTaskStatus.FAILED;
    }

    await this.jobModerationTaskRepository.updateOne(jobModerationTask);
    return jobModerationTask;
  }

  public async completeJobModeration(jobEntity: JobEntity): Promise<JobEntity> {
    try {
      const jobModerationTasks = await this.jobModerationTaskRepository.find({
        where: { jobId: jobEntity.id },
      });

      let allPassed = true;
      let moderationInReview = false;
      const notificationMessages: string[] = [];

      for (const task of jobModerationTasks) {
        if (task.status === JobModerationTaskStatus.FAILED) {
          allPassed = false;
          moderationInReview = true;
          notificationMessages.push(
            `Task ${task.id} failed. Please check the results.`,
          );
        } else if (task.status === JobModerationTaskStatus.POSITIVE_ABUSE) {
          allPassed = false;
          moderationInReview = true;
          notificationMessages.push(
            `Task ${task.id} flagged for abusive content. Immediate review required.`,
          );
        } else if (task.status === JobModerationTaskStatus.POSSIBLE_ABUSE) {
          moderationInReview = true;
          notificationMessages.push(
            `Task ${task.id} flagged for possible abuse. Review required.`,
          );
        }
      }

      if (allPassed) {
        jobEntity.status = JobStatus.MODERATION_PASSED;
      } else if (moderationInReview) {
        jobEntity.status = JobStatus.POSSIBLE_ABUSE_IN_REVIEW;
      }

      await this.jobRepository.updateOne(jobEntity);
      this.logger.log(
        `Job ${jobEntity.id} completed moderation with status: ${jobEntity.status}`,
      );

      if (notificationMessages.length > 0) {
        const fullMessage = `Job ${jobEntity.id} requires review:\n- ${notificationMessages.join('\n- ')}`;
        await sendSlackNotification(
          this.slackConfigService.abuseNotificationWebhookUrl,
          fullMessage,
        );
      }
    } catch (error) {
      this.logger.error('Error completing job moderation:', error);
      throw new Error('Failed to complete job moderation');
    }

    return jobEntity;
  }

  public async collectModerationResults(
    fileName: string,
  ): Promise<DataModerationResultDto> {
    try {
      const hash = hashString(fileName);
      const bucketPrefix = `${this.visionConfigService.tempAsyncResultsBucket}/${hash}`;
      const bucketName = this.visionConfigService.moderationResultsBucket;
      const bucket = this.storage.bucket(bucketName);

      const [files] = await bucket.getFiles({ prefix: `${bucketPrefix}` });
      if (!files || files.length === 0) {
        throw new ControlledError(
          ErrorJobModeration.NoResultsFound,
          HttpStatus.NOT_FOUND,
        );
      }

      const moderationResults = await Promise.all(
        files.map(async (file) => {
          try {
            const fileContent = await this.downloadFileContent(
              file.name,
              bucket,
            );
            if (Array.isArray(fileContent.responses)) {
              return fileContent.responses;
            }
            this.logger.warn(`Invalid content in file ${file.name}`);
            return [];
          } catch (error) {
            this.logger.error(`Error processing file ${file.name}:`, error);
            throw new ControlledError(
              ErrorJobModeration.ResultsParsingFailed,
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }
        }),
      );

      const flatResults = moderationResults.flat();
      return this.categorizeModerationResults(flatResults);
    } catch (error) {
      this.logger.error('Error collecting moderation results:', error);
      throw new ControlledError(
        ErrorJobModeration.ResultsParsingFailed,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private categorizeModerationResults(
    moderationResults: protos.google.cloud.vision.v1.IAnnotateImageResponse[],
  ): DataModerationResultDto {
    const results: ImageModerationResultDto[] = moderationResults
      .map((response: protos.google.cloud.vision.v1.IAnnotateImageResponse) => {
        const safeSearch = response.safeSearchAnnotation;
        const imageUrl = convertToHttpUrl(response.context?.uri ?? '');

        if (safeSearch) {
          return {
            imageUrl: imageUrl,
            moderationResult: {
              adult: safeSearch.adult,
              violence: safeSearch.violence,
              racy: safeSearch.racy,
              spoof: safeSearch.spoof,
              medical: safeSearch.medical,
            },
          } as ImageModerationResultDto;
        } else {
          this.logger.log(
            `No safe search annotation found for the image: ${imageUrl}`,
          );
          return null;
        }
      })
      .filter((result): result is ImageModerationResultDto => result !== null);

    return {
      positiveAbuseResults: results.filter((result) =>
        checkModerationLevels(result.moderationResult, [
          CONTENT_MODERATION_LEVEL.VERY_LIKELY,
          CONTENT_MODERATION_LEVEL.LIKELY,
        ]),
      ),
      possibleAbuseResults: results.filter((result) =>
        checkModerationLevels(result.moderationResult, [
          CONTENT_MODERATION_LEVEL.POSSIBLE,
        ]),
      ),
    };
  }

  public async processJobModerationTask(
    jobModerationTask: JobModerationTaskEntity,
  ): Promise<void> {
    try {
      const dataFiles = await listObjectsInBucket(
        new URL(jobModerationTask.dataUrl),
      );

      const gcDataUrl = convertToGCSPath(jobModerationTask.dataUrl);
      const validFiles = dataFiles.filter(
        (fileName) => fileName && !fileName.endsWith('/'),
      );

      // Slice the files array based on the 'from' and 'to' indices
      const filesToProcess = validFiles.slice(
        jobModerationTask.from - 1,
        jobModerationTask.to,
      );

      const imageUrls = filesToProcess.map(
        (fileName) => `${gcDataUrl}/${fileName.split('/').pop()}`,
      );

      const fileName = getFileName(
        jobModerationTask.dataUrl,
        jobModerationTask.jobId.toString(),
        jobModerationTask.id.toString(),
      );
      await this.asyncBatchAnnotateImages(imageUrls, fileName);

      jobModerationTask.status = JobModerationTaskStatus.PROCESSED;
      await this.jobModerationTaskRepository.updateOne(jobModerationTask);

      this.logger.log('Processing completed.');
    } catch (error) {
      this.logger.error('Error processing dataset:', error);

      jobModerationTask.status = JobModerationTaskStatus.FAILED;
      await this.jobModerationTaskRepository.updateOne(jobModerationTask);

      throw new Error(ErrorJobModeration.ErrorProcessingDataset);
    }
  }

  public async asyncBatchAnnotateImages(
    imageUrls: string[],
    fileName: string,
  ): Promise<void> {
    const requests = imageUrls.map((imageUrl) => ({
      image: { source: { imageUri: imageUrl } },
      features: [
        { type: CONTENT_MODERATION_FEATURE.SAFE_SEARCH_DETECTION as any },
      ],
    }));

    const requestPayload = {
      requests,
      outputConfig: {
        gcsDestination: {
          uri: constructGcsPath(
            this.visionConfigService.moderationResultsBucket,
            this.visionConfigService.tempAsyncResultsBucket,
            hashString(fileName),
          ),
        },
        batchSize: JOB_MODERATION_ASYNC_BATCH_SIZE,
      },
    };

    try {
      const [operation] =
        await this.visionClient.asyncBatchAnnotateImages(requestPayload);
      this.logger.log('Async operation started:', operation.name);

      const [filesResponse] = await operation.promise();
      this.logger.log('Async operation completed:', filesResponse);

      const destinationUri = filesResponse?.outputConfig?.gcsDestination?.uri;
      this.logger.log(`Output written to GCS: ${destinationUri}`);
    } catch (error) {
      this.logger.error('Error analyzing images:', error);
      throw new ControlledError(
        ErrorJobModeration.ContentModerationFailed,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  public async handleAbuseLinks(
    imageLinks: string[],
    jobModerationTaskId: number,
    jobId: number,
    isConfirmedAbuse: boolean,
  ): Promise<void> {
    const bucketName = this.visionConfigService.moderationResultsBucket;
    const fileName = `moderation_results_${jobId}.txt`;

    const file = this.storage.bucket(bucketName).file(fileName);
    const stream = file.createWriteStream({ resumable: false });
    stream.end(imageLinks.join('\n'));

    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 24 * 1000, // 1 day
    });

    const gcsConsoleUrl = `https://console.cloud.google.com/storage/browser/${bucketName}?prefix=${fileName}`;

    const message = isConfirmedAbuse
      ? `The following images contain abusive content for job moderation task ID ${jobModerationTaskId} and job ID ${jobId}.\n\n**Results File:** <${signedUrl}|Download Here>\n**Google Cloud Console:** <${gcsConsoleUrl}|View in Console>\n\nEnsure you download the file before the link expires, or access it directly via GCS.`
      : `The following images have possible moderation issues for job moderation task ID ${jobModerationTaskId} and job ID ${jobId}.\n\n**Results File:** <${signedUrl}|Download Here>\n**Google Cloud Console:** <${gcsConsoleUrl}|View in Console>\n\nEnsure you download the file before the link expires, or access it directly via GCS.`;

    await sendSlackNotification(
      this.slackConfigService.abuseNotificationWebhookUrl,
      message,
    );
  }

  private async downloadFileContent(
    fileName: string,
    bucket: any,
  ): Promise<any> {
    const file = bucket.file(fileName);
    const [content] = await file.download();

    try {
      const jsonString = content.toString('utf-8');
      return JSON.parse(jsonString);
    } catch (error) {
      this.logger.error(`Error parsing content of file ${fileName}:`, error);
      throw new ControlledError(
        ErrorJobModeration.ResultsParsingFailed,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
