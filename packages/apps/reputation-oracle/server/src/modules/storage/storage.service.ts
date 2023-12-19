import {
  ChainId,
  Encryption,
  EncryptionUtils,
  StorageClient,
} from '@human-protocol/sdk';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as Minio from 'minio';
import { ConfigNames, S3ConfigType, s3ConfigKey } from '../../common/config';
import crypto from 'crypto';
import { UploadedFile } from '../../common/interfaces/s3';
import { FortuneFinalResult } from '../webhook/webhook.dto';
import { PassThrough } from 'stream';
import axios from 'axios';
import { Logger } from '@nestjs/common';
import { hashStream } from '../../common/utils';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  public readonly minioClient: Minio.Client;

  constructor(
    @Inject(s3ConfigKey)
    private s3Config: S3ConfigType,
    public readonly configService: ConfigService,
  ) {
    this.minioClient = new Minio.Client({
      endPoint: this.s3Config.endPoint,
      port: this.s3Config.port,
      accessKey: this.s3Config.accessKey,
      secretKey: this.s3Config.secretKey,
      useSSL: this.s3Config.useSSL,
    });
  }
  public getUrl(key: string): string {
    return `${this.s3Config.useSSL ? 'https' : 'http'}://${
      this.s3Config.endPoint
    }:${this.s3Config.port}/${this.s3Config.bucket}/${key}`;
  }

  public async download(url: string): Promise<any> {
    try {
      const fileContent = await StorageClient.downloadFileFromUrl(url);
      if (
        typeof fileContent === 'string' &&
        EncryptionUtils.isEncrypted(fileContent)
      ) {
        const encryption = await Encryption.build(
          this.configService.get<string>(
            ConfigNames.ENCRYPTION_PRIVATE_KEY,
            '',
          ),
          this.configService.get<string>(ConfigNames.ENCRYPTION_PASSPHRASE, ''),
        );

        return JSON.parse(await encryption.decrypt(fileContent));
      } else {
        return fileContent;
      }
    } catch {
      return [];
    }
  }

  public async uploadJobSolutions(
    escrowAddress: string,
    chainId: ChainId,
    solutions: FortuneFinalResult[],
  ): Promise<UploadedFile> {
    if (!(await this.minioClient.bucketExists(this.s3Config.bucket))) {
      throw new BadRequestException('Bucket not found');
    }

    const content = JSON.stringify(solutions);
    const key = `${escrowAddress}-${chainId}.json`;
    try {
      const hash = crypto.createHash('sha1').update(content).digest('hex');
      await this.minioClient.putObject(this.s3Config.bucket, key, content, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      });

      return { url: this.getUrl(key), hash };
    } catch (e) {
      throw new BadRequestException('File not uploaded');
    }
  }

  /**
   * **Copy file from a URL to cloud storage**
   *
   * @param {string} url - URL of the source file
   * @returns {Promise<UploadedFile>} - Uploaded file with key/hash
   */
  public async copyFileFromURLToBucket(url: string): Promise<UploadedFile> {
    try {
      const { data } = await axios.get(url, { responseType: 'stream' });
      const stream = new PassThrough();
      data.pipe(stream);

      const hash = await hashStream(stream);
      const key = `s3${hash}.zip`;

      await this.minioClient.putObject(this.s3Config.bucket, key, stream, {
        'Cache-Control': 'no-store',
      });

      Logger.log(`File from ${url} copied to ${this.s3Config.bucket}/${key}`);

      return {
        url: this.getUrl(key),
        hash,
      };
    } catch (error) {
      Logger.error('Error copying file:', error);
      throw new Error('File not uploaded');
    }
  }
}
