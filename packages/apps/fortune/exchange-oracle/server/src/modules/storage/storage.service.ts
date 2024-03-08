import {
  ChainId,
  Encryption,
  EncryptionUtils,
  KVStoreClient,
  EscrowClient,
  StorageClient,
} from '@human-protocol/sdk';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { ConfigNames, S3ConfigType, s3ConfigKey } from '../../common/config';
import { ISolution } from '../../common/interfaces/job';
import { Web3Service } from '../web3/web3.service';

@Injectable()
export class StorageService {
  public readonly minioClient: Minio.Client;

  constructor(
    private readonly configService: ConfigService,
    @Inject(Web3Service)
    private readonly web3Service: Web3Service,
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
  public getJobUrl(escrowAddress: string, chainId: ChainId): string {
    return `${this.s3Config.useSSL ? 'https' : 'http'}://${
      this.s3Config.endPoint
    }:${this.s3Config.port}/${
      this.s3Config.bucket
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
          this.configService.get(ConfigNames.PGP_PRIVATE_KEY, ''),
          this.configService.get(ConfigNames.PGP_PASSPHRASE),
        );

        return JSON.parse(await encryption.decrypt(fileContent)) as ISolution[];
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
    if (!(await this.minioClient.bucketExists(this.s3Config.bucket))) {
      throw new BadRequestException('Bucket not found');
    }

    let fileToUpload = JSON.stringify(solutions);
    if (this.configService.get(ConfigNames.PGP_ENCRYPT) as boolean) {
      try {
        const signer = this.web3Service.getSigner(chainId);
        const escrowClient = await EscrowClient.build(signer);
        const recordingOracleAddress =
          await escrowClient.getRecordingOracleAddress(escrowAddress);

        const kvstoreClient = await KVStoreClient.build(signer);

        const exchangeOraclePublickKey = await kvstoreClient.getPublicKey(
          signer.address,
        );
        const recordingOraclePublicKey = await kvstoreClient.getPublicKey(
          recordingOracleAddress,
        );
        if (
          !exchangeOraclePublickKey.length ||
          !recordingOraclePublicKey.length
        ) {
          throw new BadRequestException('Missing public key');
        }

        fileToUpload = await EncryptionUtils.encrypt(fileToUpload, [
          exchangeOraclePublickKey,
          recordingOraclePublicKey,
        ]);
      } catch (e) {
        Logger.error(e);
        throw new BadRequestException('Encryption error');
      }
    }

    try {
      await this.minioClient.putObject(
        this.s3Config.bucket,
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
      throw new BadRequestException('File not uploaded');
    }
  }
}
