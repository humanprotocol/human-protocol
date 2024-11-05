import { Encryption, EncryptionUtils } from '@human-protocol/sdk';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import * as Minio from 'minio';
import stringify from 'json-stable-stringify';
import { ErrorBucket } from '../../common/constants/errors';
import { ContentType, Extension } from '../../common/enums/storage';
import { UploadedFile } from '../../common/interfaces';
import { S3ConfigService } from '../../common/config/s3-config.service';
import { ControlledError } from '../../common/errors/controlled';
import { hashString } from '../../common/utils';
import {
  FileDownloadError,
  FileNotFoundError,
  InvalidFileUrl,
} from './storage.errors';

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

  public static isValidUrl(maybeUrl: string): boolean {
    try {
      const url = new URL(maybeUrl);
      return ['http:', 'https:'].includes(url.protocol);
    } catch (error) {
      return false;
    }
  }

  public static async downloadFileFromUrl(url: string): Promise<Buffer> {
    if (!this.isValidUrl(url)) {
      throw new InvalidFileUrl(url);
    }

    try {
      const { data } = await axios.get(url, {
        responseType: 'arraybuffer',
      });

      return Buffer.from(data);
    } catch (error) {
      if (error.response?.status === HttpStatus.NOT_FOUND) {
        throw new FileNotFoundError(url);
      }
      throw new FileDownloadError(url, error.cause || error.message);
    }
  }

  public formatUrl(key: string): string {
    return `${this.s3ConfigService.useSSL ? 'https' : 'http'}://${
      this.s3ConfigService.endpoint
    }:${this.s3ConfigService.port}/${this.s3ConfigService.bucket}/${key}`;
  }

  public async downloadFile(url: string): Promise<any> {
    try {
      let fileContent = await StorageService.downloadFileFromUrl(url);

      const contentAsString = fileContent.toString();
      if (EncryptionUtils.isEncrypted(contentAsString)) {
        const decryptedData = await this.encryption.decrypt(contentAsString);
        fileContent = Buffer.from(decryptedData);
      }

      return fileContent;
    } catch (error) {
      return [];
    }
  }

  public async downloadJsonLikeData(url: string): Promise<unknown> {
    try {
      const fileContent = await StorageService.downloadFileFromUrl(url);

      let jsonLikeData = fileContent.toString();
      if (EncryptionUtils.isEncrypted(jsonLikeData)) {
        const decryptedData = await this.encryption.decrypt(jsonLikeData);
        jsonLikeData = Buffer.from(decryptedData).toString();
      }

      try {
        jsonLikeData = JSON.parse(jsonLikeData);
      } catch (_noop) {}

      return jsonLikeData;
    } catch (error) {
      return [];
    }
  }

  public async uploadJsonLikeData(
    data: string | object,
  ): Promise<UploadedFile> {
    if (!(await this.minioClient.bucketExists(this.s3ConfigService.bucket))) {
      throw new ControlledError(ErrorBucket.NotExist, HttpStatus.BAD_REQUEST);
    }

    let fileContents: string;
    let contentType: ContentType;
    let extension: string;
    if (typeof data === 'string') {
      fileContents = data;
      contentType = ContentType.TEXT_PLAIN;
      extension = '';
    } else {
      fileContents = stringify(data);
      contentType = ContentType.APPLICATION_JSON;
      extension = Extension.JSON;
    }

    const hash = hashString(fileContents);

    const fileKey = `s3${hash}${extension}`;
    try {
      await this.minioClient.putObject(
        this.s3ConfigService.bucket,
        fileKey,
        fileContents,
        {
          'Content-Type': contentType,
          'Cache-Control': 'no-store',
        },
      );

      return {
        url: this.formatUrl(fileKey),
        hash,
      };
    } catch (error) {
      throw new ControlledError('File not uploaded', HttpStatus.BAD_REQUEST);
    }
  }
}
