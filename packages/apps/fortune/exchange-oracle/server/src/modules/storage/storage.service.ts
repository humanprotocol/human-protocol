import {
  ChainId,
  Encryption,
  EncryptionUtils,
  EscrowClient,
  KVStoreUtils,
  StorageClient,
} from '@human-protocol/sdk';
import { Inject, Injectable, Logger } from '@nestjs/common';
import * as Minio from 'minio';
import { PGPConfigService } from '../../common/config/pgp-config.service';
import { S3ConfigService } from '../../common/config/s3-config.service';
import { NotFoundError, ServerError } from '../../common/errors';
import { ISolution } from '../../common/interfaces/job';
import { Web3Service } from '../web3/web3.service';

@Injectable()
export class StorageService {
  public readonly minioClient: Minio.Client;

  constructor(
    @Inject(Web3Service)
    private readonly web3Service: Web3Service,
    private s3ConfigService: S3ConfigService,
    private readonly pgpConfigService: PGPConfigService,
  ) {
    this.minioClient = new Minio.Client({
      endPoint: this.s3ConfigService.endpoint,
      port: this.s3ConfigService.port,
      accessKey: this.s3ConfigService.accessKey,
      secretKey: this.s3ConfigService.secretKey,
      useSSL: this.s3ConfigService.useSSL,
    });
  }
  public getJobUrl(escrowAddress: string, chainId: ChainId): string {
    return `${this.s3ConfigService.useSSL ? 'https' : 'http'}://${
      this.s3ConfigService.endpoint
    }:${this.s3ConfigService.port}/${
      this.s3ConfigService.bucket
    }/${escrowAddress}-${chainId}.json`;
  }

  public async downloadJobSolutions(
    escrowAddress: string,
    chainId: ChainId,
  ): Promise<ISolution[]> {
    const url = this.getJobUrl(escrowAddress, chainId);
    try {
      const fileContent = await StorageClient.downloadFileFromUrl(url);
      if (EncryptionUtils.isEncrypted(fileContent)) {
        const encryption = await Encryption.build(
          this.pgpConfigService.privateKey!,
          this.pgpConfigService.passphrase,
        );

        const decryptedData = await encryption.decrypt(fileContent);
        return JSON.parse(Buffer.from(decryptedData).toString()) as ISolution[];
      }

      return typeof fileContent == 'string'
        ? (JSON.parse(fileContent) as ISolution[])
        : fileContent;
    } catch {
      return [];
    }
  }

  public async uploadJobSolutions(
    escrowAddress: string,
    chainId: ChainId,
    solutions: ISolution[],
  ): Promise<string> {
    if (!(await this.minioClient.bucketExists(this.s3ConfigService.bucket))) {
      throw new NotFoundError('Bucket not found');
    }

    let fileToUpload = JSON.stringify(solutions);
    if (this.pgpConfigService.encrypt) {
      try {
        const signer = this.web3Service.getSigner(chainId);
        const escrowClient = await EscrowClient.build(signer);
        const recordingOracleAddress =
          await escrowClient.getRecordingOracleAddress(escrowAddress);

        const exchangeOraclePublickKey = await KVStoreUtils.getPublicKey(
          chainId,
          signer.address,
        );
        const recordingOraclePublicKey = await KVStoreUtils.getPublicKey(
          chainId,
          recordingOracleAddress,
        );
        if (
          !exchangeOraclePublickKey.length ||
          !recordingOraclePublicKey.length
        ) {
          throw new ServerError('Missing public key');
        }

        fileToUpload = await EncryptionUtils.encrypt(fileToUpload, [
          exchangeOraclePublickKey,
          recordingOraclePublicKey,
        ]);
      } catch (e) {
        Logger.error(e);
        throw new ServerError('Encryption error');
      }
    }

    try {
      await this.minioClient.putObject(
        this.s3ConfigService.bucket,
        `${escrowAddress}-${chainId}.json`,
        fileToUpload,
        {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      );

      return this.getJobUrl(escrowAddress, chainId);
    } catch (e) {
      Logger.error(e);
      throw new ServerError('File not uploaded');
    }
  }
}
