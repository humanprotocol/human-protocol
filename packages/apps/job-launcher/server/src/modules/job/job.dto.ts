import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsPositive,
  IsString,
  IsUrl,
  IsDate,
  IsOptional,
  IsObject,
} from 'class-validator';
import { ChainId } from '@human-protocol/sdk';
import { JobRequestType, JobStatus } from '../../common/enums/job';

export class JobCreateDto {
  public chainId: ChainId;
  public userId: number;
  public manifestUrl: string;
  public manifestHash: string;
  public fee: number;
  public fundAmount: number;
  public status: JobStatus;
  public waitUntil: Date;
}

export class JobDto {
  @ApiProperty({
    enum: ChainId,
  })
  @IsEnum(ChainId)
  @IsOptional()
  public chainId?: ChainId;

  @ApiProperty()
  @IsString()
  public requesterDescription: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public fundAmount: number;
}

export class JobFortuneDto extends JobDto {
  @ApiProperty()
  @IsString()
  public requesterTitle: string;

  @ApiProperty()
  @IsNumber()
  public submissionsRequired: number;
}

export class JobCvatDto extends JobDto {
  @ApiProperty()
  @IsUrl()
  public dataUrl: string;

  @ApiProperty()
  @IsArray()
  public labels: string[];

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public minQuality: number;

  @ApiProperty()
  @IsString()
  public gtUrl: string;

  @IsEnum(JobRequestType)
  type: JobRequestType;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public jobBounty: number;
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

  @IsNumber()
  @IsPositive()
  fundAmount: number;

  @IsEnum(JobRequestType)
  requestType: JobRequestType;
}

export class CvatData {
  @IsString()
  data_url: string;
}

export class Label {
  @IsString()
  name: string;
}

export class Annotation {
  @IsArray()
  labels: Label[];

  @IsString()
  description: string;

  @IsEnum(JobRequestType)
  type: JobRequestType;

  @IsNumber()
  @IsPositive()
  job_size: number;

  @IsNumber()
  @IsPositive()
  max_time: number;
}

export class Validation {
  @IsNumber()
  @IsPositive()
  min_quality: number;

  @IsNumber()
  @IsPositive()
  val_size: number;

  @IsString()
  gt_url: string;
}

export class CvatManifestDto {
  @IsObject()
  data: CvatData;

  @IsObject()
  annotation: Annotation;

  @IsObject()
  validation: Validation;

  @IsNumber()
  @IsPositive()
  job_bounty: number;
}

export class FortuneFinalResultDto {
  @IsString()
  exchangeAddress: string;

  @IsString()
  workerAddress: string;

  @IsString()
  solution: string;
}

export class CvatFinalResultDto {
  @IsString()
  url: string;

  @IsString()
  final_answer: string;

  @IsArray()
  correct: string[];

  @IsArray()
  wrong: string[];
}
