import {
  ChainId,
  Encryption,
  EncryptionUtils,
  KVStoreClient,
  StorageClient,
} from '@human-protocol/sdk';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as Minio from 'minio';
import {
  S3ConfigType,
  ServerConfigType,
  s3ConfigKey,
  serverConfigKey,
} from '../../common/config';
import { ISolution } from '../../common/interfaces/job';
import crypto from 'crypto';
import { SaveSolutionsDto } from '../job/job.dto';
import { Web3Service } from '../web3/web3.service';

@Injectable()
export class StorageService {
  public readonly minioClient: Minio.Client;

  constructor(
    @Inject(s3ConfigKey)
    private s3Config: S3ConfigType,
    @Inject(serverConfigKey)
    private serverConfig: ServerConfigType,
    @Inject(Web3Service)
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
  public getJobUrl(escrowAddress: string, chainId: ChainId): string {
    return `${this.s3Config.useSSL ? 'https' : 'http'}://${
      this.s3Config.endPoint
    }:${this.s3Config.port}/${
      this.s3Config.bucket
    }/${escrowAddress}-${chainId}.json`;
  }

  public async download(url: string): Promise<any> {
    try {
      const fileContent = await StorageClient.downloadFileFromUrl(url);
      try {
        return JSON.parse(fileContent);
      } catch {
        const encryption = await Encryption.build(
          this.serverConfig.encryptionPrivateKey,
          this.serverConfig.encryptionPassphrase,
        );

        return JSON.parse(await encryption.decrypt(fileContent));
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
    if (!(await this.minioClient.bucketExists(this.s3Config.bucket))) {
      throw new BadRequestException('Bucket not found');
    }

    const signer = this.web3Service.getSigner(chainId);
    const kvstoreClient = await KVStoreClient.build(signer);

    const recordingOraclePublicKey = await kvstoreClient.getPublicKey(
      signer.address,
    );
    const reputationOraclePublicKey = await kvstoreClient.getPublicKey(
      this.serverConfig.reputationOracleAddress,
    );
    if (!recordingOraclePublicKey.length || !reputationOraclePublicKey.length) {
      throw new BadRequestException('Missing public key');
    }

    try {
      const content = await EncryptionUtils.encrypt(JSON.stringify(solutions), [
        recordingOraclePublicKey,
        reputationOraclePublicKey,
      ]);

      const hash = crypto.createHash('sha1').update(content).digest('hex');
      await this.minioClient.putObject(
        this.s3Config.bucket,
        `${escrowAddress}-${chainId}.json`,
        content,
        {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      );

      return { url: this.getJobUrl(escrowAddress, chainId), hash };
    } catch (e) {
      throw new BadRequestException('File not uploaded');
    }
  }
}
