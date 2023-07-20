import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsPositive,
  IsString,
  IsUrl,
  IsDate,
} from 'class-validator';
import { ChainId } from '@human-protocol/sdk';
import { JobRequestType, JobStatus } from '../../common/enums/job';

export class JobCreateDto {
  public chainId: ChainId;
  public userId: number;
  public manifestUrl: string;
  public manifestHash: string;
  public fee: string;
  public fundAmount: string;
  public status: JobStatus;
  public waitUntil: Date;
}

export class JobFortuneDto {
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
}

export class JobFortuneCreateDto extends JobFortuneDto {
  @IsNumber()
  public userId: number;

  @IsString()
  public manifestUrl: string;

  @IsEnum(JobStatus)
  public status: JobStatus;

  @IsDate()
  public waitUntil: Date;
}

export class JobCvatDto {
  @ApiProperty({
    enum: ChainId,
  })
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty()
  @IsUrl()
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
}

export class JobCvatCreateDto extends JobCvatDto {
  @IsNumber()
  public userId: number;

  @IsString()
  public manifestUrl: string;

  @IsEnum(JobStatus)
  public status: JobStatus;

  @IsDate()
  public waitUntil: Date;
}

export class JobUpdateDto {
  @ApiPropertyOptional({
    enum: JobStatus,
  })
  @IsEnum(JobStatus)
  public status: JobStatus;
}

export class JobUpdateDataDto extends JobUpdateDto {
  @IsNumber()
  public retriesCount: number;

  @IsDate()
  public waitUntil: Date;
}

export class SaveManifestDto {
  public manifestUrl: string;
  public manifestHash: string;
}

export class SendWebhookDto {
  public escrowAddress: string;
  public chainId: number;
}

export class FortuneManifestDto {
  @IsNumber()
  @IsPositive()
  submissionsRequired: number;

  @IsString()
  requesterTitle: string;

  @IsString()
  requesterDescription: string;

  @IsString()
  fundAmount: string;

  @IsEnum(JobRequestType)
  requestType: JobRequestType;
}

export class ImageLabelBinaryManifestDto {
  @IsString()
  dataUrl: string;

  @IsArray()
  labels: string[];

  @IsNumber()
  @IsPositive()
  submissionsRequired: number;

  @IsString()
  requesterDescription: string;

  @IsNumber()
  @IsPositive()
  requesterAccuracyTarget: number;

  @IsString()
  fundAmount: string;

  @IsEnum(JobRequestType)
  requestType: JobRequestType;
}
