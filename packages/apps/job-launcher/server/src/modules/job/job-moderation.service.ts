import { ImageAnnotatorClient, protos } from '@google-cloud/vision';
import { VisionConfigService } from '../../common/config/vision-config.service';
import { ErrorJobModeration } from '../../common/constants/errors';
import { listObjectsInBucket } from '../../common/utils/storage';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  ContentModerationFeature,
  ContentModerationLevel,
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
import { sleep } from '../../common/utils/sleep';

@Injectable()
export class JobModerationService {
  private visionClient: ImageAnnotatorClient;
  public readonly logger = new Logger(JobModerationService.name);

  constructor(
    private readonly jobRepository: JobRepository,
    private readonly visionConfigService: VisionConfigService,
    private readonly slackConfigService: SlackConfigService,
    private readonly storageService: StorageService,
  ) {}

  public async jobModeration(jobEntity: JobEntity): Promise<JobEntity> {
    const manifest = (await this.storageService.downloadJsonLikeData(
      jobEntity.manifestUrl,
    )) as any;

    const dataModerationResults: DataModerationResultDto =
      await this.dataModeration(manifest.data.data_url);

    if (dataModerationResults.containsAbuse) {
      const abusiveImageLinks = dataModerationResults.veryLikelyOrLikelyResults
        .map((result) => `- ${result.imageUrl}`)
        .join('\n');

      const message = `The following images contain abusive content and caused the job to fail:\n${abusiveImageLinks}`;

      this.logger.error(message);

      jobEntity.failedReason = message;
      jobEntity.status = JobStatus.FAILED;
      await this.jobRepository.updateOne(jobEntity);

      return jobEntity;
    }

    // If there are possible moderation issues, send a Slack notification
    if (dataModerationResults.possibleResults.length > 0) {
      const imageLinks = dataModerationResults.possibleResults
        .map((result) => `- ${result.imageUrl}`)
        .join('\n');

      const message = `The following images have possible moderation issues:\n${imageLinks}`;

      await sendSlackNotification(this.slackConfigService.webhookUrl, message);

      this.logger.log(
        'Slack notification sent with possible image links:',
        message,
      );
    }

    jobEntity.status = JobStatus.MODERATION_PASSED;
    await this.jobRepository.updateOne(jobEntity);
    return jobEntity;
  }

  public async dataModeration(
    dataUrl: string,
  ): Promise<DataModerationResultDto> {
    try {
      const dataFiles = await listObjectsInBucket(new URL(dataUrl));

      const imageUrls = dataFiles.map(
        (fileName) => `${dataUrl}/${fileName.split('/').pop()}`,
      );

      const moderationResults: ImageModerationResultDto[] =
        await this.batchAnnotateImages(imageUrls);

      if (moderationResults.length === 0) {
        this.logger.log('No valid moderation results');
        throw new ControlledError(
          ErrorJobModeration.ContentModerationFailed,
          HttpStatus.BAD_REQUEST,
        );
      }

      const veryLikelyOrLikelyResults = moderationResults.filter((result) =>
        this.isVeryLikelyOrLikely(result.moderationResult),
      );

      const possibleResults = moderationResults.filter((result) =>
        this.isPossible(result.moderationResult),
      );

      const containsAbuse = veryLikelyOrLikelyResults.length > 0;

      this.logger.log('Processing completed.');

      return {
        containsAbuse,
        veryLikelyOrLikelyResults,
        possibleResults,
      };
    } catch (error) {
      this.logger.error('Error processing dataset:', error);
      throw new Error(ErrorJobModeration.ErrorProcessingDataset);
    }
  }

  public async batchAnnotateImages(
    imageUrls: string[],
  ): Promise<ImageModerationResultDto[]> {
    this.visionClient = new ImageAnnotatorClient({
      projectId: this.visionConfigService.projectId,
      credentials: {
        private_key: this.visionConfigService.privateKey,
        client_email: this.visionConfigService.clientEmail,
      },
    });

    const batchSize = JOB_MODERATION_BATCH_SIZE;
    const delayBetweenBatches =
      ONE_MINUTE_IN_MS / JOB_MODERATION_MAX_REQUESTS_PER_MINUTE;

    const results: ImageModerationResultDto[] = [];

    for (let i = 0; i < imageUrls.length; i += batchSize) {
      const batch = imageUrls.slice(i, i + batchSize);

      const request = {
        requests: batch.map((imageUrl) => ({
          image: { source: { imageUri: imageUrl } },
          features: [
            { type: ContentModerationFeature.SAFE_SEARCH_DETECTION as any },
          ],
        })),
      };

      try {
        const [operation]: any =
          await this.visionClient.batchAnnotateImages(request);

        results.push(
          ...operation.responses
            .map(
              (
                response: protos.google.cloud.vision.v1.IAnnotateImageResponse,
                index: number,
              ) => {
                const safeSearch = response.safeSearchAnnotation;
                if (safeSearch) {
                  return {
                    imageUrl: batch[index],
                    moderationResult: {
                      adult: safeSearch.adult,
                      violence: safeSearch.violence,
                      racy: safeSearch.racy,
                      spoof: safeSearch.spoof,
                      medical: safeSearch.medical,
                    },
                  };
                } else {
                  this.logger.log(
                    `No safe search annotation found for the image: ${batch[index]}`,
                  );
                  return null;
                }
              },
            )
            .filter((result: any) => result !== null),
        );
      } catch (error) {
        this.logger.error('Error batch annotate images:', error);
        throw new ControlledError(
          ErrorJobModeration.ContentModerationFailed,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (i + batchSize < imageUrls.length) {
        await sleep(delayBetweenBatches);
      }
    }

    return results;
  }

  public async asyncBatchAnnotateImages(imageUrls: string[]): Promise<string> {
    this.visionClient = new ImageAnnotatorClient({
      projectId: this.visionConfigService.projectId,
      credentials: {
        private_key: this.visionConfigService.privateKey,
        client_email: this.visionConfigService.clientEmail,
      },
    });

    const request = {
      requests: imageUrls.map((imageUrl) => ({
        image: { source: { imageUri: imageUrl } },
        features: [
          { type: ContentModerationFeature.SAFE_SEARCH_DETECTION as any },
        ],
      })),
      outputConfig: {
        gcsDestination: {
          uri: `${this.visionConfigService.outputGcsUri}/`,
        },
      },
    };

    try {
      const [operation]: any =
        await this.visionClient.asyncBatchAnnotateImages(request);
      this.logger.log('asyncBatchAnnotateImages operation: ', operation);

      const [filesResponse] = await operation.promise();

      this.logger.log('asyncBatchAnnotateImages operation: ', filesResponse);

      const destinationUri = filesResponse.outputConfig.gcsDestination.uri;
      this.logger.log(`Output written to GCS with prefix: ${destinationUri}`);
      return destinationUri;
    } catch (error) {
      this.logger.error('Error analyzing images:', error);
      throw new ControlledError(
        ErrorJobModeration.ContentModerationFailed,
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
        level === ContentModerationLevel.VERY_LIKELY ||
        level === ContentModerationLevel.LIKELY,
    );
  }

  private isPossible(result: ModerationResultDto): boolean {
    return [
      result.adult,
      result.racy,
      result.violence,
      result.spoof,
      result.medical,
    ].some((level) => level === ContentModerationLevel.POSSIBLE);
  }
}
