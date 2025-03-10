import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VisionConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * The Google Cloud Storage (GCS) path name where temporary async moderation results will be saved.
   * Required
   */
  get moderationResultsFilesPath(): string {
    return this.configService.getOrThrow<string>(
      'GCV_MODERATION_RESULTS_FILES_PATH',
    );
  }

  /**
   * The Google Cloud Storage (GCS) bucket name where moderation results will be saved.
   * Required
   */
  get moderationResultsBucket(): string {
    return this.configService.getOrThrow<string>(
      'GCV_MODERATION_RESULTS_BUCKET',
    );
  }

  /**
   * The project ID for connecting to the Google Cloud Vision API.
   * Required
   */
  get projectId(): string {
    return this.configService.getOrThrow<string>('GOOGLE_PROJECT_ID');
  }

  /**
   * The private key for authenticating with the Google Cloud Vision API.
   * Required
   */
  get privateKey(): string {
    return this.configService.getOrThrow<string>('GOOGLE_PRIVATE_KEY');
  }

  /**
   * The client email used for authenticating requests to the Google Cloud Vision API.
   * Required
   */
  get clientEmail(): string {
    return this.configService.getOrThrow<string>('GOOGLE_CLIENT_EMAIL');
  }
}
