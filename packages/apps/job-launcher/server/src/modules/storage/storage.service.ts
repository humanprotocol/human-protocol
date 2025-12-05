import { Encryption, EncryptionUtils } from '@human-protocol/sdk';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import stringify from 'json-stable-stringify';
import * as Minio from 'minio';
import { isURL } from 'validator';
import { S3ConfigService } from '../../common/config/s3-config.service';
import { ErrorBucket, ErrorStorage } from '../../common/constants/errors';
import { ContentType, Extension } from '../../common/enums/storage';
import { ServerError, ValidationError } from '../../common/errors';
import { UploadedFile } from '../../common/interfaces';
import { hashString } from '../../common/utils';

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
    return isURL(maybeUrl, {
      require_protocol: true,
      protocols: ['http', 'https'],
      require_tld: false,
    });
  }

  public static async downloadFileFromUrl(url: string): Promise<Buffer> {
    if (!this.isValidUrl(url)) {
      throw new ValidationError(`${ErrorStorage.InvalidUrl}: ${url}`);
    }

    try {
      const { data } = await axios.get(url, {
        responseType: 'arraybuffer',
      });

      return Buffer.from(data);
    } catch (error) {
      if (error.response?.status === HttpStatus.NOT_FOUND) {
        throw new ServerError(`${ErrorStorage.NotFound}: ${url}`);
      }
      throw new ServerError(`${ErrorStorage.FailedToDownload}: ${url}`);
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
    } catch (_error) {
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
      } catch (_noop) {
        // Ignore error
      }

      return jsonLikeData;
    } catch (_error) {
      return [];
    }
  }

  public async uploadJsonLikeData(
    data: string | object,
  ): Promise<UploadedFile> {
    if (!(await this.minioClient.bucketExists(this.s3ConfigService.bucket))) {
      throw new ServerError(ErrorBucket.NotExist);
    }

    let fileContents: string;
    let contentType: ContentType;
    let extension: string;
    if (typeof data === 'string') {
      fileContents = data;
      contentType = ContentType.TEXT_PLAIN;
      extension = '';
    } else {
      fileContents = stringify(data) as string;
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
        undefined,
        {
          'Content-Type': contentType,
          'Cache-Control': 'no-store',
        },
      );

      return {
        url: this.formatUrl(fileKey),
        hash,
      };
    } catch (_error) {
      throw new ServerError(ErrorStorage.FileNotUploaded);
    }
  }
}
