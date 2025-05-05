import { Injectable } from '@nestjs/common';
import * as Minio from 'minio';

import { ContentType } from '../../common/enums';
import { S3ConfigService } from '../../config';
import logger from '../../logger';
import * as httpUtils from '../../utils/http';

import { PgpEncryptionService } from '../encryption';

import { MinioErrorCodes } from './minio.constants';

@Injectable()
export class StorageService {
  private readonly logger = logger.child({ context: StorageService.name });

  private readonly minioClient: Minio.Client;

  constructor(
    private readonly s3ConfigService: S3ConfigService,
    private readonly pgpEncryptionService: PgpEncryptionService,
  ) {
    this.minioClient = new Minio.Client({
      endPoint: this.s3ConfigService.endpoint,
      port: this.s3ConfigService.port,
      accessKey: this.s3ConfigService.accessKey,
      secretKey: this.s3ConfigService.secretKey,
      useSSL: this.s3ConfigService.useSSL,
    });
  }

  private getUrl(key: string): string {
    return `${this.s3ConfigService.useSSL ? 'https' : 'http'}://${
      this.s3ConfigService.endpoint
    }:${this.s3ConfigService.port}/${this.s3ConfigService.bucket}/${key}`;
  }

  private async checkFileExists(key: string): Promise<boolean> {
    try {
      await this.minioClient.statObject(this.s3ConfigService.bucket, key);
      return true;
    } catch (error) {
      if (error?.code === MinioErrorCodes.NotFound) {
        return false;
      }
      this.logger.error('Failed to check if file exists', {
        fileKey: key,
        error,
      });
      throw new Error('Error accessing storage');
    }
  }

  async downloadFile(url: string): Promise<Buffer> {
    try {
      let fileContent = await httpUtils.downloadFile(url);

      fileContent =
        await this.pgpEncryptionService.maybeDecryptFile(fileContent);

      return fileContent;
    } catch (error) {
      const errorMessage = 'Error downloading file';
      this.logger.error(errorMessage, {
        error,
        url,
      });
      throw new Error(errorMessage);
    }
  }

  async downloadJsonLikeData<T>(url: string): Promise<T> {
    try {
      const fileContent = await this.downloadFile(url);

      return JSON.parse(fileContent.toString());
    } catch (error) {
      const errorMessage = 'Error downloading json like data';
      this.logger.error(errorMessage, {
        error,
        url,
      });
      throw new Error(errorMessage);
    }
  }

  async uploadData(
    content: string | Buffer,
    fileName: string,
    contentType: ContentType,
  ): Promise<string> {
    const isConfiguredBucketExists = await this.minioClient.bucketExists(
      this.s3ConfigService.bucket,
    );

    if (!isConfiguredBucketExists) {
      throw new Error("Can't find configured bucket");
    }

    try {
      const fileUrl = this.getUrl(fileName);

      const isAlreadyUploaded = await this.checkFileExists(fileName);
      if (isAlreadyUploaded) {
        return fileUrl;
      }

      await this.minioClient.putObject(
        this.s3ConfigService.bucket,
        fileName,
        content,
        {
          'Content-Type': contentType,
          'Cache-Control': 'no-store',
        },
      );

      return fileUrl;
    } catch (error) {
      this.logger.error('Failed to upload data', {
        error,
        fileName,
        contentType,
      });
      throw new Error('Data not uploaded');
    }
  }
}
