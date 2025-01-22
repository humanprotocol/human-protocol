import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VisionConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * The project ID for connecting to the Google Cloud Vision API.
   * Required
   */
  get projectId(): string {
    return this.configService.getOrThrow<string>('GOOGLE_PROJECT_ID');
  }

  /**
   * The Google Cloud Storage (GCS) bucket name where moderation results with possible issues will be saved.
   * Required
   */
  get possibleAbuseResultsBucket(): string {
    return this.configService.getOrThrow<string>(
      'GOOGLE_CLOUD_STORAGE_POSSIBLE_ABUSE_RESULTS_BUCKET',
    );
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
