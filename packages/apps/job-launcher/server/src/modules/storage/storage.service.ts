import {
  Encryption,
  EncryptionUtils,
  StorageClient,
} from '@human-protocol/sdk';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import * as Minio from 'minio';
import stringify from 'json-stable-stringify';
import { ErrorBucket } from '../../common/constants/errors';
import { ContentType, Extension } from '../../common/enums/storage';
import { UploadedFile } from '../../common/interfaces';
import { S3ConfigService } from '../../common/config/s3-config.service';
import { ControlledError } from '../../common/errors/controlled';

@Injectable()
export class StorageService {
  public readonly minioClient: Minio.Client;

  constructor(
    public readonly s3ConfigService: S3ConfigService,
    @Inject(Encryption) private readonly encryption: Encryption,
  ) {
    this.minioClient = new Minio.Client({
      endPoint: this.s3ConfigService.endpoint,
      port: this.s3ConfigService.port,
      accessKey: this.s3ConfigService.accessKey,
      secretKey: this.s3ConfigService.secretKey,
      useSSL: this.s3ConfigService.useSSL,
    });
  }
  public formatUrl(key: string): string {
    return `${this.s3ConfigService.useSSL ? 'https' : 'http'}://${
      this.s3ConfigService.endpoint
    }:${this.s3ConfigService.port}/${this.s3ConfigService.bucket}/${key}`;
  }

  public async download(url: string): Promise<any> {
    try {
      const fileContent = await StorageClient.downloadFileFromUrl(url);
      if (
        typeof fileContent === 'string' &&
        EncryptionUtils.isEncrypted(fileContent)
      ) {
        return await this.encryption.decrypt(fileContent);
      } else {
        return fileContent;
      }
    } catch {
      return [];
    }
  }

  public async uploadFile(
    data: string | object,
    hash: string,
  ): Promise<UploadedFile> {
    if (!(await this.minioClient.bucketExists(this.s3ConfigService.bucket))) {
      throw new ControlledError(ErrorBucket.NotExist, HttpStatus.BAD_REQUEST);
    }

    const isStringData = typeof data === 'string';
    const contentType = isStringData
      ? ContentType.TEXT_PLAIN
      : ContentType.APPLICATION_JSON;
    const content = isStringData ? data : stringify(data);
    const key = `s3${hash}${isStringData ? '' : Extension.JSON}`;

    try {
      await this.minioClient.putObject(
        this.s3ConfigService.bucket,
        key,
        content,
        {
          'Content-Type': contentType,
          'Cache-Control': 'no-store',
        },
      );

      return { url: this.formatUrl(key), hash };
    } catch (e) {
      throw new ControlledError('File not uploaded', HttpStatus.BAD_REQUEST);
    }
  }
}
