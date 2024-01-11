import {
  ChainId,
  Encryption,
  EncryptionUtils,
  StakingClient,
  StorageClient,
} from '@human-protocol/sdk';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
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
      const encryption = await Encryption.build(
        this.configService.get(ConfigNames.ENCRYPTION_PRIVATE_KEY, ''),
        this.configService.get(ConfigNames.ENCRYPTION_PASSPHRASE),
      );

      const encryptedSolution = await StorageClient.downloadFileFromUrl(url);

      return JSON.parse(
        await encryption.decrypt(encryptedSolution),
      ) as ISolution[];
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

    const signer = this.web3Service.getSigner(chainId);
    const stakingClient = await StakingClient.build(signer);
    const exchangeOracle = await stakingClient.getLeader(signer.address);
    const recordingOracle = await stakingClient.getLeader(
      this.configService.get<string>(ConfigNames.RECORDING_ORACLE_ADDRESS, ''),
    );
    if (!exchangeOracle.publicKey || !recordingOracle.publicKey) {
      throw new BadRequestException('Missing public key');
    }

    try {
      const solutionsEncrypted = await EncryptionUtils.encrypt(
        JSON.stringify(solutions),
        [exchangeOracle.publicKey, recordingOracle.publicKey],
      );

      await this.minioClient.putObject(
        this.s3Config.bucket,
        `${escrowAddress}-${chainId}.json`,
        solutionsEncrypted,
        {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      );

      return this.getJobUrl(escrowAddress, chainId);
    } catch (e) {
      throw new BadRequestException('File not uploaded');
    }
  }
}
