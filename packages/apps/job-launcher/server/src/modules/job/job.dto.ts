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
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ChainId } from '@human-protocol/sdk';
import {
  JobCaptchaRequestType,
  JobCaptchaShapeType,
  JobRequestType,
  JobStatus,
  WorkerBrowser,
  WorkerLanguage,
  WorkerLocation,
} from '../../common/enums/job';
import { EventType } from '../../common/enums/webhook';
import { AWSRegions, StorageProviders } from '../../common/enums/storage';
export class JobCreateDto {
  @ApiProperty({ enum: ChainId })
  @IsEnum(ChainId)
  @IsNotEmpty()
  public chainId: ChainId;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public userId: number;

  @ApiProperty()
  @IsUrl()
  @IsNotEmpty()
  public manifestUrl: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  public manifestHash: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public fee: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public fundAmount: number;

  @ApiProperty({ enum: JobStatus })
  @IsEnum(JobStatus)
  @IsNotEmpty()
  public status: JobStatus;

  @ApiProperty()
  @IsDate()
  public waitUntil: Date;
}

export class JobDto {
  @ApiProperty({ enum: ChainId, required: false })
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

export class StorageDataDto {
  @ApiProperty({ enum: StorageProviders })
  @IsEnum(StorageProviders)
  public provider: StorageProviders;
  @ApiProperty({ enum: AWSRegions })
  @IsEnum(AWSRegions)
  public region: AWSRegions | null;
  @ApiProperty()
  @IsString()
  public bucketName: string;
  @ApiProperty()
  @IsOptional()
  @IsString()
  public path: string;
}

export class JobCvatDto extends JobDto {
  @ApiProperty()
  @IsString()
  public requesterDescription: string;

  @ApiProperty()
  @IsObject()
  public data: StorageDataDto;

  @ApiProperty()
  @IsArray()
  @ArrayMinSize(1)
  public labels: string[];

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public minQuality: number;

  @ApiProperty()
  @IsObject()
  public groundTruth: StorageDataDto;

  @ApiProperty()
  @IsUrl()
  public userGuide: string;

  @ApiProperty({ enum: JobRequestType })
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
  @ApiPropertyOptional({ enum: JobStatus })
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
  @ApiProperty({ description: 'Ethereum address of the staker' })
  @IsEthereumAddress()
  public staker: string;

  @ApiProperty({ description: 'Amount allocated' })
  @IsNumber()
  @Min(0)
  public allocated: number;

  @ApiProperty({ description: 'Amount slashed' })
  @IsNumber()
  @Min(0)
  public slashed: number;
}

export class ManifestDetails {
  @ApiProperty({ description: 'Chain ID' })
  @IsNumber()
  @Min(1)
  public chainId: number;

  @ApiProperty({ description: 'Title (optional)' })
  @IsOptional()
  @IsString()
  public title?: string;

  @ApiProperty({ description: 'Description' })
  @IsNotEmpty()
  @IsString()
  public description?: string;

  @ApiProperty({ description: 'Submissions required' })
  @IsNumber()
  public submissionsRequired: number;

  @ApiProperty({ description: 'Ethereum address of the token' })
  @IsEthereumAddress()
  public tokenAddress: string;

  @ApiProperty({ description: 'Amount of funds' })
  @IsNumber()
  public fundAmount: number;

  @ApiProperty({ description: 'Ethereum address of the requester' })
  @IsEthereumAddress()
  public requesterAddress: string;

  @ApiProperty({ description: 'Request type' })
  @IsEnum(JobRequestType)
  public requestType: JobRequestType;

  @ApiProperty({ description: 'Address of the exchange oracle (optional)' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  public exchangeOracleAddress?: string;

  @ApiProperty({ description: 'Address of the recording oracle (optional)' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  public recordingOracleAddress?: string;

  @ApiProperty({ description: 'Address of the reputation oracle (optional)' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  public reputationOracleAddress?: string;
}

export class CommonDetails {
  @ApiProperty({ description: 'Ethereum address of the escrow' })
  @IsEthereumAddress()
  public escrowAddress: string;

  @ApiProperty({ description: 'URL of the manifest' })
  @IsUrl()
  public manifestUrl: string;

  @ApiProperty({ description: 'Hash of the manifest' })
  @IsString()
  public manifestHash: string;

  @ApiProperty({ description: 'Balance amount' })
  @IsNumber()
  @Min(0)
  public balance: number;

  @ApiProperty({ description: 'Amount paid out' })
  @IsNumber()
  @Min(0)
  public paidOut: number;

  @ApiProperty({ description: 'Number of tasks (optional)' })
  @IsNumber()
  public amountOfTasks?: number;

  @ApiProperty({ description: 'Status of the job' })
  @IsEnum(JobStatus)
  public status: JobStatus;
}

export class JobDetailsDto {
  @ApiProperty({ description: 'Details of the job' })
  @IsNotEmpty()
  public details: CommonDetails;

  @ApiProperty({ description: 'Manifest details' })
  @IsNotEmpty()
  public manifest: ManifestDetails;

  @ApiProperty({ description: 'Staking details' })
  @IsNotEmpty()
  public staking: StakingDetails;
}

export class SaveManifestDto {
  @ApiProperty()
  public manifestUrl: string;

  @ApiProperty()
  public manifestHash: string;
}

export class FortuneWebhookDto {
  @ApiProperty({ enum: ChainId })
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty()
  public escrowAddress: string;

  @ApiProperty({ enum: EventType })
  @IsEnum(EventType)
  public eventType: EventType;
}

export class CVATWebhookDto {
  @ApiProperty()
  public escrow_address: string;

  @ApiProperty({ enum: ChainId })
  @IsEnum(ChainId)
  public chain_id: number;

  @ApiProperty({ enum: EventType })
  @IsEnum(EventType)
  public event_type: EventType;
}

export class FortuneManifestDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public submissionsRequired: number;

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

  @ApiProperty({ enum: JobRequestType })
  @IsEnum(JobRequestType)
  public requestType: JobRequestType;
}

export class CvatData {
  @ApiProperty()
  @IsString()
  public data_url: string;
}

export class Label {
  @ApiProperty()
  @IsString()
  public name: string;
}

export class Annotation {
  @ApiProperty()
  @IsArray()
  public labels: Label[];

  @ApiProperty()
  @IsString()
  public description: string;

  @ApiProperty()
  @IsString()
  public user_guide: string;

  @ApiProperty({ enum: JobRequestType })
  @IsEnum(JobRequestType)
  public type: JobRequestType;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public job_size: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public max_time: number;
}

export class Validation {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public min_quality: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public val_size: number;

  @ApiProperty()
  @IsString()
  public gt_url: string;
}

export class CvatManifestDto {
  @ApiProperty()
  @IsObject()
  public data: CvatData;

  @ApiProperty()
  @IsObject()
  public annotation: Annotation;

  @ApiProperty()
  @IsObject()
  public validation: Validation;

  @ApiProperty()
  @IsString()
  public job_bounty: string;
}

export class FortuneFinalResultDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public workerAddress: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public solution: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  public error?: string;
}

export class CvatFinalResultDto {
  @ApiProperty()
  @IsString()
  public url: string;

  @ApiProperty()
  @IsString()
  public final_answer: string;

  @ApiProperty()
  @IsArray()
  public correct: string[];

  @ApiProperty()
  @IsArray()
  public wrong: string[];
}

export class JobListDto {
  @ApiProperty()
  public jobId: number;

  @ApiProperty({ required: false })
  public escrowAddress?: string;

  @ApiProperty()
  public network: string;

  @ApiProperty()
  public fundAmount: number;

  @ApiProperty()
  public status: JobStatus;
}

export class EscrowFailedWebhookDto {
  @ApiProperty({ enum: ChainId })
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty()
  @IsString()
  public escrowAddress: string;

  @ApiProperty({ enum: EventType })
  @IsEnum(EventType)
  public eventType: EventType;

  @ApiProperty()
  @IsString()
  public reason: string;
}

export class EscrowCancelDto {
  @ApiProperty()
  public txHash: string;

  @ApiProperty()
  public amountRefunded: bigint;
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
  targetBrowser?: WorkerBrowser;
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
  label?: string;

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
  data: StorageDataDto;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  @Max(1)
  accuracyTarget: number;

  @ApiProperty()
  @IsDateString()
  @IsOptional()
  completionDate: Date;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  @Max(100)
  minRequests: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  @Max(100)
  maxRequests: number;

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
  sitekey?: Record<string, { score: number }>[];

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

  @IsNumber()
  @IsPositive()
  multiple_choice_max_choices?: number;

  @IsNumber()
  @IsPositive()
  multiple_choice_min_choices?: number;

  @IsString()
  answer_type?: string;

  overlap_threshold?: any;

  @IsNumber()
  @IsPositive()
  max_length?: number;

  @IsNumber()
  @IsPositive()
  min_length?: number;
}

export class HCaptchaManifestDto {
  @IsString()
  job_mode: string;

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
  @IsOptional()
  requester_question_example?: string[];

  @IsObject()
  requester_question: Record<string, string>;

  @IsUrl()
  taskdata_uri: string;

  @IsNumber()
  job_total_tasks: number;

  @IsNumber()
  task_bid_price: number;

  @IsUrl()
  groundtruth_uri?: string;

  public_results: boolean;

  @IsNumber()
  oracle_stake: number;

  @IsString()
  repo_uri: string;

  @IsString()
  ro_uri: string;

  @IsObject()
  @ValidateNested()
  restricted_audience: RestrictedAudience;

  @IsObject()
  @ValidateNested({ each: true })
  requester_restricted_answer_set: RequesterRestrictedAnswer;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  taskdata?: TaskData[];
}

class DatapointText {
  @IsString()
  en: string;
}

class TaskData {
  @IsString()
  task_key: string;

  @IsOptional()
  @IsString()
  datapoint_uri?: string;

  @IsString()
  datapoint_hash: string;

  @IsObject()
  @IsOptional()
  datapoint_text?: DatapointText;
}
