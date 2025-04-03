import { ChainId, EscrowClient } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
import * as Minio from 'minio';

import { FortuneFinalResult } from '../../common/interfaces/job-result';
import { S3ConfigService } from '../../config/s3-config.service';
import logger from '../../logger';
import * as httpUtils from '../../utils/http';

import { PgpEncryptionService } from '../encryption/pgp-encryption.service';
import { Web3Service } from '../web3/web3.service';
import { MinioErrorCodes } from './minio.constants';

type UploadedFile = {
  url: string;
  hash: string;
};

@Injectable()
export class StorageService {
  private readonly logger = logger.child({ context: StorageService.name });

  private readonly minioClient: Minio.Client;

  constructor(
    private readonly s3ConfigService: S3ConfigService,
    private readonly web3Service: Web3Service,
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

  private async encryptJobSolutionsData(
    escrowAddress: string,
    chainId: ChainId,
    content: string | Buffer,
  ) {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);

    const jobLauncherAddress =
      await escrowClient.getJobLauncherAddress(escrowAddress);

    return this.pgpEncryptionService.encrypt(content, chainId, [
      jobLauncherAddress,
    ]);
  }

  async downloadJsonLikeData(url: string): Promise<any> {
    try {
      let fileContent = await httpUtils.downloadFile(url);

      fileContent =
        await this.pgpEncryptionService.maybeDecryptFile(fileContent);

      let jsonLikeData = fileContent.toString();
      try {
        jsonLikeData = JSON.parse(jsonLikeData);
      } catch (noop) {}

      return jsonLikeData;
    } catch (error) {
      this.logger.error('Error downloading json like data', {
        error,
        url,
      });
      return [];
    }
  }

  async uploadJobSolutions(
    escrowAddress: string,
    chainId: ChainId,
    solutions: FortuneFinalResult[],
  ): Promise<UploadedFile> {
    const isConfiguredBucketExists = await this.minioClient.bucketExists(
      this.s3ConfigService.bucket,
    );

    if (!isConfiguredBucketExists) {
      throw new Error("Can't find configured bucket");
    }

    try {
      const content = await this.encryptJobSolutionsData(
        escrowAddress,
        chainId,
        JSON.stringify(solutions),
      );

      const hash = crypto.createHash('sha1').update(content).digest('hex');
      const key = `${hash}.json`;
      const url = this.getUrl(key);

      const isAlreadyUploaded = await this.checkFileExists(key);
      if (isAlreadyUploaded) {
        return { url, hash };
      }

      await this.minioClient.putObject(
        this.s3ConfigService.bucket,
        key,
        content,
        {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      );

      return { url, hash };
    } catch (error) {
      this.logger.error('Failed to upload job solutions', {
        error,
        escrowAddress,
        chainId,
      });
      throw new Error('File not uploaded');
    }
  }

  async copyJobSolutions(
    escrowAddress: string,
    chainId: ChainId,
    originalFileUrl: string,
  ): Promise<UploadedFile> {
    try {
      let fileContent = await httpUtils.downloadFile(originalFileUrl);
      fileContent =
        await this.pgpEncryptionService.maybeDecryptFile(fileContent);
      // Encrypt for job launcher
      const content = await this.encryptJobSolutionsData(
        escrowAddress,
        chainId,
        fileContent,
      );

      const hash = crypto.createHash('sha1').update(content).digest('hex');
      const key = `s3${hash}.zip`;
      const copiedFileurl = this.getUrl(key);

      const isAlreadyCopied = await this.checkFileExists(key);
      if (isAlreadyCopied) {
        return { url: copiedFileurl, hash };
      }

      await this.minioClient.putObject(
        this.s3ConfigService.bucket,
        key,
        content,
        {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-store',
        },
      );

      return { url: copiedFileurl, hash };
    } catch (error) {
      this.logger.error('Error copying file', {
        error,
        originalFileUrl,
        escrowAddress,
        chainId,
      });
      throw new Error('File not copied');
    }
  }
}
