import { Injectable, NotFoundException } from '@nestjs/common';
import * as Minio from 'minio';
import { S3ConfigService } from '../../common/config/s3-config.service';
import logger from '../../logger';

@Injectable()
export class StorageService {
  private readonly logger = logger.child({ context: StorageService.name });

  readonly minioClient: Minio.Client;

  constructor(private s3ConfigService: S3ConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: this.s3ConfigService.endpoint,
      port: this.s3ConfigService.port,
      accessKey: this.s3ConfigService.accessKey,
      secretKey: this.s3ConfigService.secretKey,
      useSSL: this.s3ConfigService.useSSL,
    });
  }

  async downloadFile(key: string): Promise<Buffer> {
    try {
      const isBucketExists = await this.minioClient.bucketExists(
        this.s3ConfigService.bucket,
      );
      if (!isBucketExists) {
        throw new NotFoundException('Bucket not found');
      }

      const fileStream = await this.minioClient.getObject(
        this.s3ConfigService.bucket,
        key,
      );

      const chunks: Buffer[] = [];
      for await (const chunk of fileStream) {
        chunks.push(Buffer.from(chunk));
      }

      return Buffer.concat(chunks);
    } catch (error) {
      const message = 'Failed to download file';
      this.logger.error(message, {
        key,
        error,
      });
      throw new Error(message);
    }
  }
}
