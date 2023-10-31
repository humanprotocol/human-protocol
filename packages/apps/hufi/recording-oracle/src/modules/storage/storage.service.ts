import { ChainId, StorageClient } from '@human-protocol/sdk';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as Minio from 'minio';
import { S3ConfigType, s3ConfigKey } from '../../common/config';
import crypto from 'crypto';
import { SaveLiquidityDto, liquidityDto } from '../liquidity/liquidity.dto';
import { ILiquidityScore } from '../../common/interfaces/liquidity';

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

  public async uploadLiquidities(
    escrowAddress: string,
    chainId: ChainId,
    liquidities: liquidityDto[],
  ): Promise<SaveLiquidityDto> {
    if (!(await this.minioClient.bucketExists(this.s3Config.bucket))) {
      throw new BadRequestException('Bucket not found');
    }
    const content = JSON.stringify(liquidities);
    try {
      const hash = crypto.createHash('sha1').update(content).digest('hex');
      const filename = `${escrowAddress}-${chainId}.json`;
      await this.minioClient.putObject(
        this.s3Config.bucket,
        filename,
        JSON.stringify(content),
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
