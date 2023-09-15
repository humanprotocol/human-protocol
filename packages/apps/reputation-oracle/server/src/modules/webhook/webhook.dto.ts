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
import { JobRequestType } from '../../common/enums';

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

  @IsNumber()
  public retriesCount: number;
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
}

export class FortuneFinalResult {
  exchangeAddress: string;
  workerAddress: string;
  solution: string;
}

export class ImageLabelBinaryJobResults {
  dataset: Dataset<ImageLabelBinaryResult>;
  worker_performance: WorkerPerformanceResult[];
}

class Dataset<T> {
  dataset_scores: { [score_name: string]: AgreementEstimate };
  data_points: T[];
}

class AgreementEstimate {
  score: number;
  interval?: [number, number];
  alpha?: number;
}

class ImageLabelBinaryResult {
  url: string;
  label: string;
  label_counts: { [label: string]: number };
  score: number;
}

class WorkerPerformanceResult {
  worker_id: string;
  consensus_annotations: number;
  total_annotations: number;
  score: number;
}
