import { ChainId, StorageClient } from '@human-protocol/sdk';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as Minio from 'minio';
import { S3ConfigType, s3ConfigKey } from '../../common/config';
import { ILiquidityScore } from '../../common/interfaces/job';
import crypto from 'crypto';
import { SaveSolutionsDto } from '../job/job.dto';


@Injectable()
export class StorageService {
  public readonly minioClient: Minio.Client;

  constructor(
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

  public async uploadLiquidityScore(
    exchangeAddress: string,
    escrowAddress: string,
    chainId: ChainId,
    liquidityProvider:string,
    liquidityScore: string,
  ): Promise<SaveSolutionsDto> {
    if (!(await this.minioClient.bucketExists(this.s3Config.bucket))) {
      throw new BadRequestException('Bucket not found');
    }
    const liquidityObject = {
      exchangeAddress: exchangeAddress,
      escrowAddress: escrowAddress,
      chainId: chainId,
      liquidityProvider:liquidityProvider,
      liquidityScore: liquidityScore,
    }
    const content = JSON.stringify(liquidityObject);
    try {
      const hash = crypto.createHash('sha1').update(content).digest('hex');
      await this.minioClient.putObject(
        this.s3Config.bucket,
        `${escrowAddress}-${chainId}.json`,
        JSON.stringify(content),
        {
          'Content-Type': 'application/json',
        },
      );

      return { url: this.getJobUrl(escrowAddress, chainId), hash };
    } catch (e) {
      throw new BadRequestException('File not uploaded');
    }
  }

  public async download(url: string): Promise<any> {
    try {
      return await StorageClient.downloadFileFromUrl(url);
    } catch {
      return [];
    }
  }

  public async downloadLiquidityScores(
    escrowAddress: string,
    chainId: ChainId,
  ): Promise<ILiquidityScore[]> {
    const url = this.getJobUrl(escrowAddress, chainId);
    try {
      return await StorageClient.downloadFileFromUrl(url);
    } catch {
      return [];
    }
  }
}
