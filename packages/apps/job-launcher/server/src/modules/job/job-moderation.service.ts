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
import { JobStatus } from '../../common/enums/job';
import { hashString } from '../../common/utils';
import { checkModerationLevels } from '../../common/utils/job-moderation';

@Injectable()
export class JobModerationService {
  private visionClient: ImageAnnotatorClient;
  private storage: Storage;
  public readonly logger = new Logger(JobModerationService.name);

  constructor(
    private readonly jobRepository: JobRepository,
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

    if (!isGCSBucketUrl(manifest.data.data_url)) {
      throw new Error(ErrorJobModeration.DataMustBeStoredInGCS);
    }

    await this.asyncDataModeration(manifest.data.data_url);

    jobEntity.status = JobStatus.UNDER_MODERATION;
    await this.jobRepository.updateOne(jobEntity);
    return jobEntity;
  }

  public async parseJobModerationResults(
    jobEntity: JobEntity,
  ): Promise<JobEntity> {
    try {
      const manifest: any = await this.storageService.downloadJsonLikeData(
        jobEntity.manifestUrl,
      );
      const moderationResults = await this.collectModerationResults(
        manifest.data.data_url,
      );

      if (moderationResults.positiveAbuseResults.length > 0) {
        const abusiveImageLinks = moderationResults.positiveAbuseResults.map(
          (result) => result.imageUrl,
        );
        await this.handleAbuseLinks(abusiveImageLinks, jobEntity.id, true);

        this.logger.error(`Job ${jobEntity.id} failed due to abusive content.`);

        jobEntity.failedReason = `Job failed due to detected abusive content. See the detailed report.`;
        jobEntity.status = JobStatus.FAILED;
      } else if (moderationResults.possibleAbuseResults.length > 0) {
        const possibleAbuseLinks = moderationResults.possibleAbuseResults.map(
          (result) => result.imageUrl,
        );
        await this.handleAbuseLinks(possibleAbuseLinks, jobEntity.id, false);

        jobEntity.failedReason = `Job flagged for review due to possible moderation concerns. See the detailed report.`;
        jobEntity.status = JobStatus.POSSIBLE_ABUSE_IN_REVIEW;
      } else {
        jobEntity.status = JobStatus.MODERATION_PASSED;
      }
    } catch (error) {
      this.logger.error('Error parsing job moderation results:', error);
      jobEntity.status = JobStatus.FAILED;
      jobEntity.failedReason =
        'Moderation process failed due to an internal error.';
    }

    await this.jobRepository.updateOne(jobEntity);
    return jobEntity;
  }

  public async collectModerationResults(
    dataUrl: string,
  ): Promise<DataModerationResultDto> {
    try {
      const hash = hashString(dataUrl);
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

  public async asyncDataModeration(dataUrl: string): Promise<void> {
    try {
      const dataFiles = await listObjectsInBucket(new URL(dataUrl));

      const gcDataUrl = convertToGCSPath(dataUrl);
      const validFiles = dataFiles.filter(
        (fileName) => fileName && !fileName.endsWith('/'),
      );

      const imageUrls = validFiles.map(
        (fileName) => `${gcDataUrl}/${fileName.split('/').pop()}`,
      );

      await this.asyncBatchAnnotateImages(imageUrls, dataUrl);

      this.logger.log('Processing completed.');
    } catch (error) {
      this.logger.error('Error processing dataset:', error);
      throw new Error(ErrorJobModeration.ErrorProcessingDataset);
    }
  }

  public async asyncBatchAnnotateImages(
    imageUrls: string[],
    dataUrl: string,
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
            hashString(dataUrl),
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
      ? `The following images contain abusive content for job ID ${jobId}.\n\n**Results File:** <${signedUrl}|Download Here>\n**Google Cloud Console:** <${gcsConsoleUrl}|View in Console>\n\nEnsure you download the file before the link expires, or access it directly via GCS.`
      : `The following images have possible moderation issues for job ID ${jobId}.\n\n**Results File:** <${signedUrl}|Download Here>\n**Google Cloud Console:** <${gcsConsoleUrl}|View in Console>\n\nEnsure you download the file before the link expires, or access it directly via GCS.`;

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
