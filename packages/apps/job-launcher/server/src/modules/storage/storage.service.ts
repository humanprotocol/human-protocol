import { StorageClient } from '@human-protocol/sdk';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as Minio from 'minio';
import { S3ConfigType, s3ConfigKey } from '../../common/config';
import { PassThrough } from 'stream';
import axios from 'axios';
import { Logger } from '@nestjs/common';
import { hashStream, hashString } from '../../common/utils';
import { ErrorBucket } from '../../common/constants/errors';
import { parseString } from 'xml2js';
import stringify from 'json-stable-stringify';
import {v4 as uuidv4} from 'uuid';
import { ContentType, Extension } from '../../common/enums/storage';
import { UploadedFile } from '../../common/interfaces';

@Injectable()
export class StorageService {
  public readonly minioClient: Minio.Client;

  constructor(
    @Inject(s3ConfigKey)
    private s3Config: S3ConfigType,
  ) {
    this.minioClient = new Minio.Client({
      endPoint: this.s3Config.endPoint,
      port: this.s3Config.port,
      accessKey: this.s3Config.accessKey,
      secretKey: this.s3Config.secretKey,
      useSSL: this.s3Config.useSSL,
    });
  }
  public formatUrl(key: string): string {
    return `${this.s3Config.useSSL ? 'https' : 'http'}://${
      this.s3Config.endPoint
    }:${this.s3Config.port}/${this.s3Config.bucket}/${key}`;
  }

  public async download(url: string): Promise<any> {
    try {
      return await StorageClient.downloadFileFromUrl(url);
    } catch {
      return [];
    }
  }

  public async uploadFile(
    data: string | object,
    hash: string
  ): Promise<UploadedFile> {
    if (!(await this.minioClient.bucketExists(this.s3Config.bucket))) {
      throw new BadRequestException(ErrorBucket.NotExist);
    }

    const isStringData = typeof data === 'string';
    const contentType = isStringData ? ContentType.TEXT_PLAIN : ContentType.APPLICATION_JSON
    const content = isStringData ? data : stringify(data);
    const key = `s3${hash}${isStringData ? '' : Extension.JSON}`;

    try {
      await this.minioClient.putObject(
        this.s3Config.bucket,
        key,
        content,
        {
          'Content-Type': contentType,
        },
      );

      return { url: this.formatUrl(key), hash};
    } catch (e) {
      throw new BadRequestException('File not uploaded');
    }
  }

  public async listObjectsInBucket(bucketUrl: string): Promise<string[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.get(bucketUrl);
  
        if (response.status === 200 && response.data) {
          parseString(response.data, (err: any, result: any) => {
            if (err) {
              reject(err);
            }
  
            const objectKeys = result.ListBucketResult.Contents.map((item: any) => item.Key);
            resolve(objectKeys.flat());
          });
        } else {
          reject(ErrorBucket.FailedToFetchBucketContents);
        }
      } catch (err) {
        reject(err);
      }
    });
  }
}