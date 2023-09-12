import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsObject,
  IsPositive,
  IsString,
  IsUrl,
} from 'class-validator';
import { WebhookStatus } from '../../common/enums';
import { ChainId } from '@human-protocol/sdk';
import { JobRequestType } from '../../common/enums';
import { BigNumber } from 'ethers';

export class WebhookIncomingDto {
  @ApiProperty()
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty()
  @IsEnum(EventType)
  public event_type: EventType;

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

  @IsString()
  job_bounty: string;
}

export class ProcessingResultDto {
  /**
   * List of recipient addresses.
   */
  recipients: string[];

  /**
   * Corresponding amounts to be paid out to recipients.
   */
  amounts: BigNumber[];

  /**
   * URL to the stored results.
   */
  url: string;

  /**
   * Hash of the stored results.
   */
  hash: string;

  /**
   * Boolean indicating if the checks passed.
   */
  checkPassed: boolean;
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
export class CvatAnnotationMetaJobs {
  id: number;
  job_id: number;
  annotator_wallet_address: string;
  annotation_quality: number;
}

export class CvatAnnotationMetaResults {
  id: number;
  job_id: number;
  annotator_wallet_address: string;
  annotation_quality: number;
}

export class CvatAnnotationMeta {
  jobs: CvatAnnotationMetaJobs[];
  results: CvatAnnotationMetaResults[];
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
