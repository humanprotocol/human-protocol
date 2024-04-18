import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3ConfigService {
  constructor(private configService: ConfigService) {}
  get endpoint(): string {
    return this.configService.get<string>('S3_ENDPOINT', '127.0.0.1');
  }
  get port(): number {
    return +this.configService.get<number>('S3_PORT', 9000);
  }
  get accessKey(): string {
    return this.configService.get<string>('S3_ACCESS_KEY', '');
  }
  get secretKey(): string {
    return this.configService.get<string>('S3_SECRET_KEY', '');
  }
  get bucket(): string {
    return this.configService.get<string>('S3_BUCKET', 'reputation');
  }
  get useSSL(): boolean {
    return this.configService.get<string>('S3_USE_SSL', 'false') === 'true';
  }
}
