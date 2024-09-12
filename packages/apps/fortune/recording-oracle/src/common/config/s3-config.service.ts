import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3ConfigService {
  constructor(private configService: ConfigService) {}
  
  /**
   * The endpoint URL for connecting to the S3 service.
   * Default: '127.0.0.1'
   */
  get endpoint(): string {
    return this.configService.get<string>('S3_ENDPOINT', '127.0.0.1');
  }

  /**
   * The port number for connecting to the S3 service.
   * Default: 9000
   */
  get port(): number {
    return +this.configService.get<number>('S3_PORT', 9000);
  }

  /**
   * The access key ID used to authenticate requests to the S3 service.
   * Default: ''
   */
  get accessKey(): string {
    return this.configService.get<string>('S3_ACCESS_KEY', '');
  }

  /**
   * The secret access key used to authenticate requests to the S3 service.
   * Default: ''
   */
  get secretKey(): string {
    return this.configService.get<string>('S3_SECRET_KEY', '');
  }

  /**
   * The name of the S3 bucket where files will be stored.
   * Default: 'recording'
   */
  get bucket(): string {
    return this.configService.get<string>('S3_BUCKET', 'recording');
  }

  /**
   * Indicates whether to use SSL (HTTPS) for connections to the S3 service.
   * Default: false
   */
  get useSSL(): boolean {
    return this.configService.get<string>('S3_USE_SSL', 'false') === 'true';
  }
}
