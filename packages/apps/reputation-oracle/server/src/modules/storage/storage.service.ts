import {
  ChainId,
  Encryption,
  EncryptionUtils,
  EscrowClient,
  KVStoreClient,
  StorageClient,
} from '@human-protocol/sdk';
import { HttpStatus, Injectable } from '@nestjs/common';
import * as Minio from 'minio';
import crypto from 'crypto';
import { UploadedFile } from '../../common/interfaces/s3';
import { Logger } from '@nestjs/common';
import { Web3Service } from '../web3/web3.service';
import { FortuneFinalResult } from '../../common/dto/result';
import { S3ConfigService } from '../../common/config/s3-config.service';
import { PGPConfigService } from '../../common/config/pgp-config.service';
import { ControlledError } from '../../common/errors/controlled';

@Injectable()
export class StorageService {
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
    const kvstoreClient = await KVStoreClient.build(signer);

    const jobLauncherAddress =
      await escrowClient.getJobLauncherAddress(escrowAddress);

    const reputationOraclePublicKey = await kvstoreClient.getPublicKey(
      signer.address,
    );
    const jobLauncherPublicKey =
      await kvstoreClient.getPublicKey(jobLauncherAddress);

    if (!reputationOraclePublicKey || !jobLauncherPublicKey) {
      throw new ControlledError('Missing public key', HttpStatus.BAD_REQUEST);
    }

    return await EncryptionUtils.encrypt(content, [
      reputationOraclePublicKey,
      jobLauncherPublicKey,
    ]);
  }

  private async decryptFile(fileContent: any): Promise<any> {
    if (
      typeof fileContent === 'string' &&
      EncryptionUtils.isEncrypted(fileContent)
    ) {
      const encryption = await Encryption.build(
        this.pgpConfigService.privateKey,
        this.pgpConfigService.passphrase,
      );
      try {
        return JSON.parse(await encryption.decrypt(fileContent));
      } catch {
        return await encryption.decrypt(fileContent);
      }
    } else {
      return fileContent;
    }
  }

  public async download(url: string): Promise<any> {
    try {
      const fileContent = await StorageClient.downloadFileFromUrl(url);

      return await this.decryptFile(fileContent);
    } catch (error) {
      Logger.error(`Error downloading ${url}:`, error);
      return [];
    }
  }

  public async uploadJobSolutions(
    escrowAddress: string,
    chainId: ChainId,
    solutions: FortuneFinalResult[],
  ): Promise<UploadedFile> {
    if (!(await this.minioClient.bucketExists(this.s3ConfigService.bucket))) {
      throw new ControlledError('Bucket not found', HttpStatus.BAD_REQUEST);
    }

    try {
      const content = await this.encryptFile(
        escrowAddress,
        chainId,
        JSON.stringify(solutions),
      );

      const hash = crypto.createHash('sha1').update(content).digest('hex');
      const key = `${hash}.json`;
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
    } catch (error) {
      throw new ControlledError('File not uploaded', HttpStatus.BAD_REQUEST);
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
      // Download the content of the file from the bucket
      let fileContent = await StorageClient.downloadFileFromUrl(url);
      fileContent = await this.decryptFile(fileContent);

      // Encrypt for job launcher
      const content = await this.encryptFile(
        escrowAddress,
        chainId,
        fileContent,
      );

      // Upload the encrypted file to the bucket
      const hash = crypto.createHash('sha1').update(content).digest('hex');
      const key = `s3${hash}.zip`;

      await this.minioClient.putObject(
        this.s3ConfigService.bucket,
        key,
        content,
        {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      );

      return {
        url: this.getUrl(key),
        hash,
      };
    } catch (error) {
      Logger.error('Error copying file:', error);
      throw new ControlledError(
        'File not uploaded',
        HttpStatus.CONFLICT,
        error.stack,
      );
    }
  }
}
