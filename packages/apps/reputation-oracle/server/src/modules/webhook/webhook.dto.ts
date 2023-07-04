import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsString,
  IsUrl,
} from 'class-validator';
import { WebhookStatus } from '../../common/enums';
import { ChainId } from '@human-protocol/sdk';
import { JobMode, JobRequestType } from '../../common/enums';

export class WebhookIncomingDto {
  @ApiProperty()
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty()
  @IsString()
  public escrowAddress: string;
}

export class WebhookIncomingCreateDto extends WebhookIncomingDto {
  @IsEnum(WebhookStatus)
  public status: WebhookStatus;

  @IsDate()
  public waitUntil: Date;
}

export class WebhookIncomingUpdateDto {
  @ApiPropertyOptional()
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiPropertyOptional()
  @IsString()
  public escrowAddress: string;

  @ApiPropertyOptional()
  @IsUrl()
  public resultsUrl: string;

  @ApiPropertyOptional()
  @IsBoolean()
  public checkPassed: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  public retriesCount: number;

  @ApiPropertyOptional({
    enum: WebhookStatus,
  })
  @IsEnum(WebhookStatus)
  public status: WebhookStatus;

  @ApiPropertyOptional()
  @IsDate()
  public waitUntil: Date;
}

export class ManifestDto {
  dataUrl?: string;
  labels?: string[];
  submissionsRequired: number;
  requesterTitle?: string;
  requesterDescription: string;
  requesterAccuracyTarget?: number;
  fee: string;
  fundAmount: string;
  requestType: JobRequestType;
  mode: JobMode;
}

export class FortuneFinalResult {
  exchangeAddress: string;
  workerAddress: string;
  solution: string;
}

export class ImageLabelBinaryFinalResult {
  url: string;
  final_answer: string;
  correct: string[];
  wrong: string[];
}
