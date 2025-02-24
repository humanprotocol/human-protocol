import {
  ChainId,
  Encryption,
  EncryptionUtils,
  EscrowClient,
  KVStoreUtils,
} from '@human-protocol/sdk';
import { HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import * as Minio from 'minio';
import crypto from 'crypto';
import { UploadedFile } from '../../common/interfaces/s3';
import { Web3Service } from '../web3/web3.service';
import { FortuneFinalResult } from '../../common/interfaces/job-result';
import { S3ConfigService } from '../../config/s3-config.service';
import { PGPConfigService } from '../../config/pgp-config.service';
import { isNotFoundError } from '../../common/errors/minio';
import {
  FileDownloadError,
  FileNotFoundError,
  InvalidFileUrl,
} from './storage.errors';
import logger from '../../logger';

@Injectable()
export class StorageService {
  private readonly logger = logger.child({ context: StorageService.name });

  public readonly minioClient: Minio.Client;

  constructor(
    public readonly s3ConfigService: S3ConfigService,
    public readonly pgpConfigService: PGPConfigService,
    private readonly web3Service: Web3Service,
  ) {
    this.minioClient = new Minio.Client({
      endPoint: this.s3ConfigService.endpoint,
      port: this.s3ConfigService.port,
      accessKey: this.s3ConfigService.accessKey,
      secretKey: this.s3ConfigService.secretKey,
      useSSL: this.s3ConfigService.useSSL,
    });
  }

  public getUrl(key: string): string {
    return `${this.s3ConfigService.useSSL ? 'https' : 'http'}://${
      this.s3ConfigService.endpoint
    }:${this.s3ConfigService.port}/${this.s3ConfigService.bucket}/${key}`;
  }

  private async encryptFile(
    escrowAddress: string,
    chainId: ChainId,
    content: any,
  ) {
    if (!this.pgpConfigService.encrypt) {
      return content;
    }

    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);

    const jobLauncherAddress =
      await escrowClient.getJobLauncherAddress(escrowAddress);

    const reputationOraclePublicKey = await KVStoreUtils.getPublicKey(
      chainId,
      signer.address,
    );
    const jobLauncherPublicKey = await KVStoreUtils.getPublicKey(
      chainId,
      jobLauncherAddress,
    );

    if (!reputationOraclePublicKey || !jobLauncherPublicKey) {
      throw new Error('Missing public key');
    }

    return await EncryptionUtils.encrypt(content, [
      reputationOraclePublicKey,
      jobLauncherPublicKey,
    ]);
  }

  private async maybeDecryptFile(fileContent: Buffer): Promise<Buffer> {
    const contentAsString = fileContent.toString();
    if (!EncryptionUtils.isEncrypted(contentAsString)) {
      return fileContent;
    }

    const encryption = await Encryption.build(
      this.pgpConfigService.privateKey!,
      this.pgpConfigService.passphrase,
    );

    const decryptedData = await encryption.decrypt(contentAsString);

    return Buffer.from(decryptedData);
  }

  public static isValidUrl(maybeUrl: string): boolean {
    try {
      const url = new URL(maybeUrl);
      return ['http:', 'https:'].includes(url.protocol);
    } catch (_error) {
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

  public async downloadJsonLikeData(url: string): Promise<any> {
    try {
      let fileContent = await StorageService.downloadFileFromUrl(url);

      fileContent = await this.maybeDecryptFile(fileContent);

      let jsonLikeData = fileContent.toString();
      try {
        jsonLikeData = JSON.parse(jsonLikeData);
      } catch (_noop) {}

      return jsonLikeData;
    } catch (error) {
      this.logger.error('Error downloading json like data', {
        error,
        url,
      });
      return [];
    }
  }

  public async uploadJobSolutions(
    escrowAddress: string,
    chainId: ChainId,
    solutions: FortuneFinalResult[],
  ): Promise<UploadedFile> {
    if (!(await this.minioClient.bucketExists(this.s3ConfigService.bucket))) {
      throw new Error('Bucket not found');
    }

    try {
      const content = await this.encryptFile(
        escrowAddress,
        chainId,
        JSON.stringify(solutions),
      );

      const hash = crypto.createHash('sha1').update(content).digest('hex');
      const key = `${hash}.json`;

      // Check if the file already exists in the bucket
      try {
        await this.minioClient.statObject(this.s3ConfigService.bucket, key);
        this.logger.info('File already exist. Skipping upload', {
          fileKey: key,
        });
        return { url: this.getUrl(key), hash };
      } catch (error) {
        if (!isNotFoundError(error)) {
          this.logger.error('Error checking if file exists', {
            error,
            fileKey: key,
          });
          throw new Error('Error accessing storage');
        }
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

      return { url: this.getUrl(key), hash };
    } catch (noop) {
      throw new Error('File not uploaded');
    }
  }

  /**
   * **Copy file from a URL to cloud storage**
   *
   * @param {string} url - URL of the source file
   * @returns {Promise<UploadedFile>} - Uploaded file with key/hash
   */
  public async copyFileFromURLToBucket(
    escrowAddress: string,
    chainId: ChainId,
    url: string,
  ): Promise<UploadedFile> {
    try {
      let fileContent = await StorageService.downloadFileFromUrl(url);
      fileContent = await this.maybeDecryptFile(fileContent);
      // Encrypt for job launcher
      const content = await this.encryptFile(
        escrowAddress,
        chainId,
        fileContent,
      );

      // Upload the encrypted file to the bucket
      const hash = crypto.createHash('sha1').update(content).digest('hex');
      const key = `s3${hash}.zip`;

      // Check if the file already exists in the bucket
      try {
        await this.minioClient.statObject(this.s3ConfigService.bucket, key);
        this.logger.info('File already exist. Skipping upload', {
          fileKey: key,
        });
        return { url: this.getUrl(key), hash };
      } catch (error) {
        if (!isNotFoundError(error)) {
          this.logger.error('Error checking if file exists', {
            error,
            fileKey: key,
          });
          throw new Error('Error accessing storage');
        }
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

      return {
        url: this.getUrl(key),
        hash,
      };
    } catch (error) {
      this.logger.error('Error copying file', {
        error,
        url,
        escrowAddress,
        chainId,
      });
      throw new Error('File not uploaded');
    }
  }
}
