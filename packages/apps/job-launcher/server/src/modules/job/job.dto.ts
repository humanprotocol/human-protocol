import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsPositive,
  IsString,
  IsUrl,
  Matches,
} from 'class-validator';
import { ChainId } from '@human-protocol/sdk';
import { JobStatus } from '../../common/enums/job';

export class JobCreateDto {
  public chainId: ChainId;
  public userId: number;
  public manifestUrl: string;
  public manifestHash: string;
  public status: JobStatus;
  public waitUntil: Date;
}

export class JobFortuneCreateDto {
  @ApiProperty({
    enum: ChainId,
  })
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty()
  @IsNumber()
  public fortunesRequired: number;

  @ApiProperty()
  @IsString()
  public requesterTitle: string;

  @ApiProperty()
  @IsString()
  public requesterDescription: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public fundAmount: number;

  public userId?: number;
  public manifestUrl?: string;
  public status?: JobStatus;
  public waitUntil?: Date;
}

export class JobCvatCreateDto {
  @ApiProperty({
    enum: ChainId,
  })
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty()
  @IsUrl()
  @Matches(/(s3-|s3\.)?(.*)\.amazonaws\.com/, {
    message: 'URL must be in the correct S3 bucket format',
  })
  public dataUrl: string;

  @ApiProperty()
  @IsNumber()
  public annotationsPerImage: number;

  @ApiProperty()
  @IsArray()
  public labels: string[];

  @ApiProperty()
  @IsString()
  public requesterDescription: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public requesterAccuracyTarget: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public fundAmount: number;

  public userId: number;

  public manifestUrl: string;
  public status: JobStatus;
  public waitUntil: Date;
}

export class JobLaunchDto {
  @ApiProperty()
  @IsNumber()
  public jobId: number;

  @ApiProperty()
  @IsString()
  public paymentId: string;
}

export class JobUpdateDto {
  @ApiPropertyOptional({
    enum: JobStatus,
  })
  @IsEnum(JobStatus)
  public status: JobStatus;

  public retriesCount?: number;
  public waitUntil?: Date;
}

export class SaveManifestDto {
  public manifestUrl: string;
  public manifestHash: string;
}

export class SendWebhookDto {
  public escrowAddress: string;
  public chainId: number;
}
