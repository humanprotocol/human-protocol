import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsPositive,
  IsString,
  IsUrl,
  IsDate,
  IsDateString,
  IsOptional,
  IsObject,
  IsNumberString,
  Min,
  Max,
  IsNotEmpty,
  IsEthereumAddress,
  ValidateNested,
  IsDefined,
  IsNotEmptyObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ChainId } from '@human-protocol/sdk';
import { JobCaptchaRequestType, JobCaptchaShapeType, JobRequestType, JobStatus, WorkerBrowser, WorkerLanguage, WorkerLocation } from '../../common/enums/job';
import { EventType } from '../../common/enums/webhook';
import { BigNumber } from 'ethers';
import { isEmpty } from 'rxjs';

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
}

export class JobFortuneDto extends JobDto {
  @ApiProperty()
  @IsString()
  public requesterTitle: string;

  @ApiProperty()
  @IsString()
  public requesterDescription: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public submissionsRequired: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public fundAmount: number;
}

export class JobCvatDto extends JobDto {
  @ApiProperty()
  @IsString()
  public requesterDescription: string;

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

  @ApiProperty()
  @IsUrl()
  public userGuide: string;

  @ApiProperty()
  @IsEnum(JobRequestType)
  type: JobRequestType;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public fundAmount: number;
}
 
export class JobCancelDto {
  @ApiProperty()
  @IsNumberString()
  public id: number;
}

export class JobIdDto {
  @ApiProperty()
  @IsNumberString()
  public id: number;
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
export class StakingDetails {
  @IsEthereumAddress()
  staker: string;

  @IsNumber()
  @Min(0)
  allocated: number;

  @IsNumber()
  @Min(0)
  slashed: number;
}

export class ManifestDetails {
  @IsNumber()
  @Min(1)
  chainId: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsNotEmpty()
  @IsString()
  description?: string;

  @IsNumber()
  submissionsRequired: number;

  @IsEthereumAddress()
  tokenAddress: string;

  @IsNumber()
  fundAmount: number;

  @IsEthereumAddress()
  requesterAddress: string;

  @IsEnum(JobRequestType)
  requestType: JobRequestType;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  exchangeOracleAddress?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  recordingOracleAddress?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  reputationOracleAddress?: string;
}

export class CommonDetails {
  @IsEthereumAddress()
  escrowAddress: string;

  @IsUrl()
  manifestUrl: string;

  @IsString()
  manifestHash: string;

  @IsNumber()
  @Min(0)
  balance: number;

  @IsNumber()
  @Min(0)
  paidOut: number;

  @IsNumber()
  amountOfTasks?: number;

  @IsEnum(JobStatus)
  status: JobStatus;
}

export class JobDetailsDto {
  @IsNotEmpty()
  details: CommonDetails;

  @IsNotEmpty()
  manifest: ManifestDetails;

  @IsNotEmpty()
  staking: StakingDetails;
}

export class SaveManifestDto {
  public manifestUrl: string;
  public manifestHash: string;
}

export class SendWebhookDto {
  public escrowAddress: string;
  public chainId: number;
  public eventType: EventType;
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

  @IsString()
  user_guide: string;

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

export class JobListDto {
  jobId: number;
  escrowAddress?: string;
  network: string;
  fundAmount: number;
  status: JobStatus;
}

export class EscrowFailedWebhookDto {
  @ApiProperty({
    enum: ChainId,
  })
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty()
  @IsString()
  public escrowAddress: string;

  @ApiProperty()
  @IsEnum(EventType)
  public eventType: EventType;

  @ApiProperty()
  @IsString()
  public reason: string;
}

export class EscrowCancelDto {
  txHash: string;
  amountRefunded: BigNumber;
}

export class JobCaptchaAdvancedDto {
  @ApiProperty({
    enum: WorkerLanguage,
  })
  @IsEnum(WorkerLanguage)
  @IsOptional()
  workerLanguage?: WorkerLanguage;

  @ApiProperty({
    enum: WorkerLocation,
  })
  @IsEnum(WorkerLocation)
  @IsOptional()
  workerLocation?: WorkerLocation;

  @ApiProperty({
    enum: WorkerBrowser,
  })
  @IsEnum(WorkerBrowser)
  @IsOptional()
  targetBrowser: WorkerBrowser;
}

export class JobCaptchaAnnotationsDto {
  @ApiProperty({
    enum: JobCaptchaShapeType,
  })
  @IsEnum(JobCaptchaShapeType)
  typeOfJob: JobCaptchaShapeType;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  taskBidPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label: string;

  @ApiProperty()
  @IsString()
  labelingPrompt: string;

  @ApiProperty()
  @IsString()
  groundTruths: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  exampleImages?: string[];
}

export class JobCaptchaDto extends JobDto {
  @ApiProperty()
  @IsUrl()
  dataUrl: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  @Max(1)
  accuracyTarget: number;

  @ApiProperty()
  @IsDateString()
  completionDate: Date;

  @ApiProperty()
  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => JobCaptchaAdvancedDto)
  advanced: JobCaptchaAdvancedDto;

  @ApiProperty()
  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => JobCaptchaAnnotationsDto)
  annotations: JobCaptchaAnnotationsDto;
}

export class RestrictedAudience {
  @IsObject()
  lang?: Record<string, { score: number }>[];

  @IsObject()
  browser?: Record<string, { score: number }>[];

  @IsObject()
  country?: Record<string, { score: number }>[];
}

class RequesterRestrictedAnswer {
  @IsString()
  en?: string;

  @IsUrl()
  answer_example_uri?: string;
}

class RequestConfig {
  @IsEnum(JobCaptchaShapeType)
  shape_type?: JobCaptchaShapeType;

  @IsNumber()
  @IsPositive()
  min_shapes_per_image?: number;

  @IsNumber()
  @IsPositive()
  max_shapes_per_image?: number;

  @IsNumber()
  @IsPositive()
  min_points?: number;

  @IsNumber()
  @IsPositive()
  max_points?: number;

  @IsNumber()
  @IsPositive()
  minimum_selection_area_per_shape?: number;
}

export class HCaptchaManifestDto {
  @IsString()
  job_mode: string;

  @IsString()
  job_api_key: string;

  @IsEnum(JobCaptchaRequestType)
  request_type: JobCaptchaRequestType;

  @IsObject()
  @ValidateNested()
  request_config: RequestConfig;

  @IsNumber()
  requester_accuracy_target: number;

  @IsNumber()
  requester_max_repeats: number;

  @IsNumber()
  requester_min_repeats: number;

  @IsArray()
  @IsUrl({}, { each: true })
  requester_question_example: string[];

  @IsObject()
  @IsString()
  requester_question: Record<string, string>;

  @IsUrl()
  taskdata_uri: string;

  @IsNumber()
  job_total_tasks: number;

  @IsNumber()
  task_bid_price: number;

  @IsUrl()
  groundtruth_uri: string;

  @IsObject()
  @ValidateNested()
  restricted_audience: RestrictedAudience;

  @IsObject()
  @ValidateNested({ each: true })
  requester_restricted_answer_set: RequesterRestrictedAnswer;
}