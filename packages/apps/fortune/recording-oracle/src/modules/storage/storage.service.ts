import {
  ChainId,
  Encryption,
  EncryptionUtils,
  EscrowClient,
  KVStoreUtils,
  StorageClient,
} from '@human-protocol/sdk';
import { Inject, Injectable } from '@nestjs/common';
import crypto from 'crypto';
import * as Minio from 'minio';
import { PGPConfigService } from '../../common/config/pgp-config.service';
import { S3ConfigService } from '../../common/config/s3-config.service';
import { ServerError, ValidationError } from '../../common/errors';
import { ISolution } from '../../common/interfaces/job';
import { SaveSolutionsDto } from '../job/job.dto';
import { Web3Service } from '../web3/web3.service';

@Injectable()
export class StorageService {
  public readonly minioClient: Minio.Client;

  constructor(
    private s3ConfigService: S3ConfigService,
    private pgpConfigService: PGPConfigService,
    @Inject(Web3Service)
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
  public getJobUrl(hash: string): string {
    return `${this.s3ConfigService.useSSL ? 'https' : 'http'}://${
      this.s3ConfigService.endpoint
    }:${this.s3ConfigService.port}/${this.s3ConfigService.bucket}/${hash}.json`;
  }

  public async download(url: string): Promise<any> {
    try {
      const fileContent = await StorageClient.downloadFileFromUrl(url);

      if (
        typeof fileContent === 'string' &&
        EncryptionUtils.isEncrypted(fileContent)
      ) {
        try {
          const privateKey = this.pgpConfigService.privateKey;
          if (!privateKey) {
            throw new ServerError('Unable to decrypt manifest');
          }
          const encryption = await Encryption.build(
            privateKey,
            this.pgpConfigService.passphrase,
          );

          const decryptedData = await encryption.decrypt(fileContent);
          return JSON.parse(Buffer.from(decryptedData).toString());
        } catch {
          throw new ServerError('Unable to decrypt manifest');
        }
      } else {
        try {
          return typeof fileContent === 'string'
            ? JSON.parse(fileContent)
            : fileContent;
        } catch {
          return null;
        }
      }
    } catch {
      return [];
    }
  }

  public async uploadJobSolutions(
    escrowAddress: string,
    chainId: ChainId,
    solutions: ISolution[],
  ): Promise<SaveSolutionsDto> {
    if (!(await this.minioClient.bucketExists(this.s3ConfigService.bucket))) {
      throw new ValidationError('Bucket not found');
    }

    let fileToUpload = JSON.stringify(solutions);
    if (this.pgpConfigService.encrypt) {
      try {
        const signer = this.web3Service.getSigner(chainId);
        const escrowClient = await EscrowClient.build(signer);
        const reputationOracleAddress =
          await escrowClient.getReputationOracleAddress(escrowAddress);

        const recordingOraclePublicKey = await KVStoreUtils.getPublicKey(
          chainId,
          signer.address,
        );
        const reputationOraclePublicKey = await KVStoreUtils.getPublicKey(
          chainId,
          reputationOracleAddress,
        );
        if (
          !recordingOraclePublicKey ||
          !recordingOraclePublicKey.length ||
          !reputationOraclePublicKey ||
          !reputationOraclePublicKey.length
        ) {
          throw new ServerError('Missing public key');
        }

        fileToUpload = await EncryptionUtils.encrypt(fileToUpload, [
          recordingOraclePublicKey,
          reputationOraclePublicKey,
        ]);
      } catch {
        throw new ServerError('Encryption error');
      }
    }

    try {
      const hash = crypto.createHash('sha1').update(fileToUpload).digest('hex');
      await this.minioClient.putObject(
        this.s3ConfigService.bucket,
        `${hash}.json`,
        fileToUpload,
        undefined,
        {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      );

      return { url: this.getJobUrl(hash), hash };
    } catch {
      throw new ServerError('File not uploaded');
    }
  }
}
