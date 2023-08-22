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

export class CreateJobDto {
  @ApiProperty({
    enum: ChainId,
  })
  @IsEnum(ChainId)
  @IsOptional()
  public chainId?: ChainId;

  @ApiProperty({
    enum: JobRequestType,
  })
  @IsEnum(JobRequestType)
  public requestType: JobRequestType;

  @ApiProperty()
  @IsNumber()
  public submissionsRequired: number;

  @ApiProperty()
  @IsString()
  public requesterDescription: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public fundAmount: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  public requesterTitle?: string;

  @ApiPropertyOptional()
  @IsUrl()
  @IsOptional()
  public dataUrl?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  public labels?: string[];

  @ApiPropertyOptional()
  @IsNumber()
  @IsPositive()
  @IsOptional()
  public requesterAccuracyTarget?: number;
}

export class JobDto {
  @ApiProperty({
    enum: ChainId,
  })
  @IsEnum(ChainId)
  @IsOptional()
  public chainId?: ChainId;

  @ApiProperty()
  @IsNumber()
  public submissionsRequired: number;

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
}

export class JobImageLabelBinaryDto extends JobDto {
  @ApiProperty()
  @IsUrl()
  public dataUrl: string;

  @ApiProperty()
  @IsArray()
  public labels: string[];

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public requesterAccuracyTarget: number;
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

export class FortuneFinalResultDto {
  @IsString()
  exchangeAddress: string;

  @IsString()
  workerAddress: string;

  @IsString()
  solution: string;
}

export class ImageLabelBinaryFinalResultDto {
  @IsString()
  url: string;

  @IsString()
  final_answer: string;

  @IsArray()
  correct: string[];

  @IsArray()
  wrong: string[];
}
