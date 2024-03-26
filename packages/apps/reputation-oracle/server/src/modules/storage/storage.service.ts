import {
  ChainId,
  Encryption,
  EncryptionUtils,
  EscrowClient,
  KVStoreClient,
  StorageClient,
} from '@human-protocol/sdk';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as Minio from 'minio';
import { ConfigNames, S3ConfigType, s3ConfigKey } from '../../common/config';
import crypto from 'crypto';
import { UploadedFile } from '../../common/interfaces/s3';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Web3Service } from '../web3/web3.service';
import { FortuneFinalResult } from '../../common/dto/result';

@Injectable()
export class StorageService {
  public readonly minioClient: Minio.Client;

  constructor(
    @Inject(s3ConfigKey)
    private s3Config: S3ConfigType,
    public readonly configService: ConfigService,
    private readonly web3Service: Web3Service,
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

  private async encryptFile(
    escrowAddress: string,
    chainId: ChainId,
    content: any,
  ) {
    if (!this.configService.get<boolean>(ConfigNames.PGP_ENCRYPT)) {
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
      throw new BadRequestException('Missing public key');
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
        this.configService.get<string>(ConfigNames.ENCRYPTION_PRIVATE_KEY, ''),
        this.configService.get<string>(ConfigNames.ENCRYPTION_PASSPHRASE, ''),
      );

      return await encryption.decrypt(fileContent);
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
    if (!(await this.minioClient.bucketExists(this.s3Config.bucket))) {
      throw new BadRequestException('Bucket not found');
    }

    try {
      const content = await this.encryptFile(
        escrowAddress,
        chainId,
        JSON.stringify(solutions),
      );

      const hash = crypto.createHash('sha1').update(content).digest('hex');
      const key = `${hash}.json`;
      await this.minioClient.putObject(this.s3Config.bucket, key, content, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      });

      return { url: this.getUrl(key), hash };
    } catch (error) {
      Logger.error('Error uploading job solution:', error);
      throw new BadRequestException('File not uploaded');
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

      await this.minioClient.putObject(this.s3Config.bucket, key, content, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      });

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
