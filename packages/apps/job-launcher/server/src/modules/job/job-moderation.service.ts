import { ImageAnnotatorClient, protos } from '@google-cloud/vision';
import { Storage } from '@google-cloud/storage';
import { VisionConfigService } from '../../common/config/vision-config.service';
import { ErrorJobModeration } from '../../common/constants/errors';
import {
  convertToGCSPath,
  convertToHttpUrl,
  listObjectsInBucket,
} from '../../common/utils/storage';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  CONTENT_MODERATION_FEATURE,
  CONTENT_MODERATION_LEVEL,
  GS_PROTOCOL,
  JOB_MODERATION_ASYNC_BATCH_SIZE,
  JOB_MODERATION_BATCH_SIZE,
  JOB_MODERATION_MAX_REQUESTS_PER_MINUTE,
  ONE_MINUTE_IN_MS,
} from '../../common/constants';
import {
  DataModerationResultDto,
  ImageModerationResultDto,
  ModerationResultDto,
} from './job-moderation.dto';
import { ControlledError } from '../../common/errors/controlled';
import { StorageService } from '../storage/storage.service';
import { SlackConfigService } from '../../common/config/slack-config.service';
import { sendSlackNotification } from '../../common/utils/slack';
import { JobEntity } from './job.entity';
import { JobRepository } from './job.repository';
import { JobStatus } from '../../common/enums/job';
import { hashString } from '../../common/utils';
import { sleep } from '../../common/utils/sleep';

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

    await this.asyncDataModeration(manifest.data.data_url);

    jobEntity.status = JobStatus.ON_MODERATION;
    await this.jobRepository.updateOne(jobEntity);
    return jobEntity;
  }

  public async jobModerationSync(jobEntity: JobEntity): Promise<JobEntity> {
    const manifest = (await this.storageService.downloadJsonLikeData(
      jobEntity.manifestUrl,
    )) as any;

    const dataModerationResults: DataModerationResultDto =
      await this.dataModeration(manifest.data.data_url);

    if (dataModerationResults.positiveAbuseResults.length > 0) {
      const abusiveImageLinks = dataModerationResults.positiveAbuseResults.map(
        (result) => result.imageUrl,
      );

      await this.handleAbuseLinks(abusiveImageLinks, jobEntity.id, true);

      const message = `The following images contain abusive content and caused the job to fail:\n\n${abusiveImageLinks.join('\n')}`;

      this.logger.error(message);

      jobEntity.failedReason = message;
      jobEntity.status = JobStatus.FAILED;
      await this.jobRepository.updateOne(jobEntity);

      return jobEntity;
    }

    // If there are possible moderation issues, save links to GCS and send a Slack notification
    if (dataModerationResults.possibleAbuseResults.length > 0) {
      const possibleAbuseImageLinks =
        dataModerationResults.possibleAbuseResults.map(
          (result) => result.imageUrl,
        );

      await this.handleAbuseLinks(possibleAbuseImageLinks, jobEntity.id, false);
      const message = `The following images have been flagged as potentially containing abusive content. This has triggered a review process for the job:\n\n${possibleAbuseImageLinks.join('\n')}`;
      this.logger.warn(message);

      jobEntity.status = JobStatus.POSSIBLE_ABUSE_IN_REVIEW;
      jobEntity.failedReason = message;
      await this.jobRepository.updateOne(jobEntity);
      return jobEntity;
    }

    jobEntity.status = JobStatus.MODERATION_PASSED;
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

        const message = `The following images contain abusive content and caused the job to fail:\n\n${abusiveImageLinks.join('\n')}`;
        this.logger.error(message);

        jobEntity.failedReason = message;
        jobEntity.status = JobStatus.FAILED;
        await this.jobRepository.updateOne(jobEntity);
        return jobEntity;
      }

      if (moderationResults.possibleAbuseResults.length > 0) {
        const possibleAbuseLinks = moderationResults.possibleAbuseResults.map(
          (result) => result.imageUrl,
        );
        await this.handleAbuseLinks(possibleAbuseLinks, jobEntity.id, false);

        const message = `The following images are flagged for review:\n\n${possibleAbuseLinks.join('\n')}`;
        jobEntity.status = JobStatus.POSSIBLE_ABUSE_IN_REVIEW;
        jobEntity.failedReason = message;
        await this.jobRepository.updateOne(jobEntity);
        return jobEntity;
      }

      jobEntity.status = JobStatus.MODERATION_PASSED;
      await this.jobRepository.updateOne(jobEntity);
      return jobEntity;
    } catch (error) {
      this.logger.error('Error parsing job moderation results:', error);
      throw new ControlledError(
        ErrorJobModeration.ResultsParsingFailed,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  public async collectModerationResults(
    dataUrl: string,
  ): Promise<DataModerationResultDto> {
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
          const fileContent = await this.downloadFileContent(file.name, bucket);
          if (Array.isArray(fileContent.responses)) {
            return fileContent.responses;
          }
          this.logger.warn(`Invalid content in file ${file.name}`);
          return [];
        } catch (error) {
          this.logger.error(`Error processing file ${file.name}:`, error);
          return [];
        }
      }),
    );

    const flatResults = moderationResults.flat();
    return this.categorizeModerationResults(flatResults);
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
        this.isVeryLikelyOrLikely(result.moderationResult),
      ),
      possibleAbuseResults: results.filter((result) =>
        this.isPossible(result.moderationResult),
      ),
    };
  }

  public async dataModeration(
    dataUrl: string,
  ): Promise<DataModerationResultDto> {
    try {
      const dataFiles = await listObjectsInBucket(new URL(dataUrl));
      const imageUrls = dataFiles.map(
        (fileName) => `${dataUrl}/${fileName.split('/').pop()}`,
      );
      const moderationResults = await this.batchAnnotateImages(imageUrls);

      if (moderationResults.length === 0) {
        throw new ControlledError(
          ErrorJobModeration.ContentModerationFailed,
          HttpStatus.BAD_REQUEST,
        );
      }

      return this.categorizeModerationResults(moderationResults);
    } catch (error) {
      this.logger.error('Error processing dataset:', error);
      throw new ControlledError(
        ErrorJobModeration.ErrorProcessingDataset,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async asyncDataModeration(dataUrl: string): Promise<void> {
    try {
      const dataFiles = await listObjectsInBucket(new URL(dataUrl + '/'));

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
          uri: `${GS_PROTOCOL}${this.visionConfigService.moderationResultsBucket}/${this.visionConfigService.tempAsyncResultsBucket}/${hashString(dataUrl)}`,
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
      if (!destinationUri) {
        throw new ControlledError(
          ErrorJobModeration.NoDestinationURIFound,
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(`Output written to GCS: ${destinationUri}`);
    } catch (error) {
      this.logger.error('Error analyzing images:', error);
      throw new ControlledError(
        ErrorJobModeration.ContentModerationFailed,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  public async batchAnnotateImages(
    imageUrls: string[],
  ): Promise<protos.google.cloud.vision.v1.IAnnotateImageResponse[]> {
    try {
      const batchSize = JOB_MODERATION_BATCH_SIZE;
      const delayBetweenBatches =
        ONE_MINUTE_IN_MS / JOB_MODERATION_MAX_REQUESTS_PER_MINUTE;

      const allResults: protos.google.cloud.vision.v1.IAnnotateImageResponse[] =
        [];

      for (let i = 0; i < imageUrls.length; i += batchSize) {
        const batch = imageUrls.slice(i, i + batchSize);
        const requests = batch.map((url) => ({
          image: { source: { imageUri: url } },
          features: [
            { type: CONTENT_MODERATION_FEATURE.SAFE_SEARCH_DETECTION as any },
          ],
        }));

        this.logger.log(
          `Processing batch ${i / batchSize + 1} with ${batch.length} images...`,
        );

        const [response] = await this.visionClient.batchAnnotateImages({
          requests,
        });

        if (response.responses) {
          const validResponses = response.responses.filter(
            (res) => res.safeSearchAnnotation !== null,
          );

          allResults.push(...validResponses);
        } else {
          this.logger.warn(
            `No responses received for batch ${i / batchSize + 1}.`,
          );
        }

        if (i + batchSize < imageUrls.length) {
          await sleep(delayBetweenBatches);
        }
      }

      return allResults;
    } catch (error) {
      this.logger.error('Error in batchAnnotateImages:', error);
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
    const bucketName = isConfirmedAbuse
      ? this.visionConfigService.moderationResultsBucket
      : this.visionConfigService.moderationResultsBucket;

    const fileName = `moderation_results_${jobId}.txt`;

    const file = this.storage.bucket(bucketName).file(fileName);
    const stream = file.createWriteStream({ resumable: false });
    stream.end(imageLinks.join('\n'));

    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 24 * 1000, // 1 day
    });

    const message = isConfirmedAbuse
      ? `The following images contain abusive content for job id ${jobId}. The results are saved <${signedUrl}|here>.`
      : `The following images have possible moderation issues for job id ${jobId}. The results are saved <${signedUrl}|here>.`;

    await sendSlackNotification(
      this.slackConfigService.abuseNotificationWebhookUrl,
      message,
    );

    this.logger.log(
      'Slack notification sent with image links and signed URL:',
      signedUrl,
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

  private isVeryLikelyOrLikely(result: ModerationResultDto): boolean {
    return [
      result.adult,
      result.racy,
      result.violence,
      result.spoof,
      result.medical,
    ].some(
      (level) =>
        level === CONTENT_MODERATION_LEVEL.VERY_LIKELY ||
        level === CONTENT_MODERATION_LEVEL.LIKELY,
    );
  }

  private isPossible(result: ModerationResultDto): boolean {
    return [
      result.adult,
      result.racy,
      result.violence,
      result.spoof,
      result.medical,
    ].some((level) => level === CONTENT_MODERATION_LEVEL.POSSIBLE);
  }
}
