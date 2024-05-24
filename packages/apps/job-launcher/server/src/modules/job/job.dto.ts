import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsPositive,
  IsString,
  IsUrl,
  IsDateString,
  IsOptional,
  IsObject,
  IsNumberString,
  IsIn,
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
  JobCurrency,
  JobRequestType,
  JobSortField,
  JobStatus,
  JobStatusFilter,
  WorkerBrowser,
  WorkerLanguage,
  WorkerLocation,
} from '../../common/enums/job';
import { Transform } from 'class-transformer';
import { AWSRegions, StorageProviders } from '../../common/enums/storage';
import { PageOptionsDto } from '../../common/pagination/pagination.dto';

export class JobDto {
  @ApiProperty({ enum: ChainId, required: false, name: 'chain_id' })
  @IsEnum(ChainId)
  @IsOptional()
  public chainId?: ChainId;
}

export class JobQuickLaunchDto extends JobDto {
  @ApiProperty({
    description: 'Request type',
    name: 'request_type',
    enum: JobRequestType,
  })
  @IsEnum(JobRequestType)
  public requestType: JobRequestType;

  @ApiProperty({ name: 'manifest_url' })
  @IsUrl()
  @IsNotEmpty()
  public manifestUrl: string;

  @ApiProperty({ name: 'manifest_hash' })
  @IsString()
  @IsOptional()
  public manifestHash: string;

  @ApiProperty({ name: 'fund_amount' })
  @IsNumber()
  @IsPositive()
  public fundAmount: number;
}

export class JobFortuneDto extends JobDto {
  @ApiProperty({ name: 'requester_title' })
  @IsString()
  public requesterTitle: string;

  @ApiProperty({ name: 'requester_description' })
  @IsString()
  public requesterDescription: string;

  @ApiProperty({ name: 'submissions_required' })
  @IsNumber()
  @IsPositive()
  public submissionsRequired: number;

  @ApiProperty({ name: 'fund_amount' })
  @IsNumber()
  @IsPositive()
  public fundAmount: number;

  @ApiProperty({ enum: JobCurrency })
  @IsEnum(JobCurrency)
  public currency: JobCurrency;
}

export class StorageDataDto {
  @ApiProperty({ enum: StorageProviders })
  @IsEnum(StorageProviders)
  public provider: StorageProviders;

  @ApiProperty({ enum: AWSRegions })
  @IsEnum(AWSRegions)
  public region: AWSRegions | null;

  @ApiProperty({ name: 'bucket_name' })
  @IsString()
  public bucketName: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  public path: string;
}

export class CvatDataDto {
  @ApiProperty()
  @IsObject()
  public dataset: StorageDataDto;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  public points?: StorageDataDto;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  public boxes?: StorageDataDto;
}

export class JobCvatDto extends JobDto {
  @ApiProperty({ name: 'requester_description' })
  @IsString()
  public requesterDescription: string;

  @ApiProperty()
  @IsObject()
  public data: CvatDataDto;

  @ApiProperty()
  @IsArray()
  @ArrayMinSize(1)
  public labels: Label[];

  @ApiProperty({ name: 'min_quality' })
  @IsNumber()
  @IsPositive()
  public minQuality: number;

  @ApiProperty({ name: 'ground_truth' })
  @IsObject()
  public groundTruth: StorageDataDto;

  @ApiProperty({ name: 'user_guide' })
  @IsUrl()
  public userGuide: string;

  @ApiProperty({ enum: JobRequestType })
  @IsEnum(JobRequestType)
  public type: JobRequestType;

  @ApiProperty({ name: 'fund_amount' })
  @IsNumber()
  @IsPositive()
  public fundAmount: number;

  @ApiProperty({ enum: JobCurrency })
  @IsEnum(JobCurrency)
  public currency: JobCurrency;
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
  @ApiProperty({ description: 'Chain ID', name: 'chain_id' })
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

  @ApiProperty({
    description: 'Submissions required',
    name: 'submissions_required',
  })
  @IsNumber()
  public submissionsRequired: number;

  @ApiProperty({
    description: 'Ethereum address of the token',
    name: 'token_address',
  })
  @IsEthereumAddress()
  public tokenAddress: string;

  @ApiProperty({ description: 'Amount of funds', name: 'fund_amount' })
  @IsNumber()
  public fundAmount: number;

  @ApiProperty({
    description: 'Ethereum address of the requester',
    name: 'requester_address',
  })
  @IsEthereumAddress()
  public requesterAddress: string;

  @ApiProperty({ description: 'Request type', name: 'request_type' })
  @IsEnum(JobRequestType)
  public requestType: JobRequestType;

  @ApiProperty({
    description: 'Address of the exchange oracle (optional)',
    name: 'exchange_oracle_address',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  public exchangeOracleAddress?: string;

  @ApiProperty({
    description: 'Address of the recording oracle (optional)',
    name: 'recording_oracle_address',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  public recordingOracleAddress?: string;

  @ApiProperty({
    description: 'Address of the reputation oracle (optional)',
    name: 'reputation_oracle_address',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  public reputationOracleAddress?: string;
}

export class CommonDetails {
  @ApiProperty({
    description: 'Ethereum address of the escrow',
    name: 'escrow_address',
  })
  @IsEthereumAddress()
  public escrowAddress: string;

  @ApiProperty({
    description: 'URL of the manifest',
    name: 'manifest_url',
  })
  @IsUrl()
  public manifestUrl: string;

  @ApiProperty({
    description: 'Hash of the manifest',
    name: 'manifest_hash',
  })
  @IsString()
  public manifestHash: string;

  @ApiProperty({ description: 'Balance amount' })
  @IsNumber()
  @Min(0)
  public balance: number;

  @ApiProperty({
    description: 'Amount paid out',
    name: 'paid_out',
  })
  @IsNumber()
  @Min(0)
  public paidOut: number;

  @ApiProperty({
    description: 'Number of tasks (optional)',
    name: 'amount_of_tasks',
  })
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

export class FortuneManifestDto {
  @ApiProperty({ name: 'submissions_required' })
  @IsNumber()
  @IsPositive()
  public submissionsRequired: number;

  @ApiProperty({ name: 'requester_title' })
  @IsString()
  public requesterTitle: string;

  @ApiProperty({ name: 'requester_description' })
  @IsString()
  public requesterDescription: string;

  @ApiProperty({ name: 'fund_amount' })
  @IsNumber()
  @IsPositive()
  public fundAmount: number;

  @ApiProperty({ enum: JobRequestType, name: 'request_type' })
  @IsEnum(JobRequestType)
  public requestType: JobRequestType;
}

export class CvatData {
  @IsUrl()
  public data_url: string;

  @IsUrl()
  @IsOptional()
  public points_url?: string;

  @IsUrl()
  @IsOptional()
  public boxes_url?: string;
}

export class Label {
  @ApiProperty()
  @IsString()
  public name: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  public nodes?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  public joints?: string[];
}

export class Annotation {
  @IsArray()
  public labels: Label[];

  @IsString()
  public description: string;

  @IsString()
  public user_guide: string;

  @IsEnum(JobRequestType)
  public type: JobRequestType;

  @IsNumber()
  @IsPositive()
  public job_size: number;
}

export class Validation {
  @IsNumber()
  @IsPositive()
  public min_quality: number;

  @IsNumber()
  @IsPositive()
  public val_size: number;

  @IsString()
  public gt_url: string;
}

export class CvatManifestDto {
  @IsObject()
  public data: CvatData;

  @IsObject()
  public annotation: Annotation;

  @IsObject()
  public validation: Validation;

  @IsString()
  public job_bounty: string;
}

export class FortuneFinalResultDto {
  @ApiProperty({ name: 'worker_address' })
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

export class JobListDto {
  @ApiProperty({ name: 'job_id' })
  public jobId: number;

  @ApiProperty({ required: false, name: 'escrow_address' })
  public escrowAddress?: string;

  @ApiProperty()
  public network: string;

  @ApiProperty({ name: 'fund_amount' })
  public fundAmount: number;

  @ApiProperty()
  public status: JobStatus;
}
export class GetJobsDto extends PageOptionsDto {
  @ApiPropertyOptional({
    name: 'sort_field',
    enum: JobSortField,
    default: JobSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(JobSortField)
  sortField?: JobSortField = JobSortField.CREATED_AT;

  @ApiPropertyOptional({
    name: 'chain_id',
    enum: ChainId,
    type: [Number],
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value
      ? (Array.isArray(value) ? value : [value]).map(
          (v) => Number(v) as ChainId,
        )
      : value,
  )
  @IsIn(Object.values(ChainId).filter((value) => typeof value === 'number'), {
    each: true,
  })
  chainId?: ChainId[];

  @ApiPropertyOptional({ enum: JobStatusFilter })
  @IsEnum(JobStatusFilter)
  @IsOptional()
  status?: JobStatusFilter;
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
    name: 'worker_language',
  })
  @IsEnum(WorkerLanguage)
  @IsOptional()
  workerLanguage?: WorkerLanguage;

  @ApiProperty({
    enum: WorkerLocation,
    name: 'workerocation',
  })
  @IsEnum(WorkerLocation)
  @IsOptional()
  workerLocation?: WorkerLocation;

  @ApiProperty({
    enum: WorkerBrowser,
    name: 'target_browser',
  })
  @IsEnum(WorkerBrowser)
  @IsOptional()
  targetBrowser?: WorkerBrowser;
}

export class JobCaptchaAnnotationsDto {
  @ApiProperty({
    enum: JobCaptchaShapeType,
    name: 'type_of_job',
  })
  @IsEnum(JobCaptchaShapeType)
  typeOfJob: JobCaptchaShapeType;

  @ApiProperty({ name: 'task_bid_price' })
  @IsNumber()
  @IsPositive()
  taskBidPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({ name: 'labeling_prompt' })
  @IsString()
  labelingPrompt: string;

  @ApiProperty({ name: 'ground_truths' })
  @IsString()
  groundTruths: string;

  @ApiProperty({ name: 'example_images' })
  @IsOptional()
  @IsArray()
  exampleImages?: string[];
}

export class JobCaptchaDto extends JobDto {
  @ApiProperty()
  @IsObject()
  data: StorageDataDto;

  @ApiProperty({ name: 'accuracy_target' })
  @IsNumber()
  @IsPositive()
  @Max(1)
  accuracyTarget: number;

  @ApiProperty({ name: 'completion_date' })
  @IsDateString()
  @IsOptional()
  completionDate: Date;

  @ApiProperty({ name: 'min_requests' })
  @IsNumber()
  @IsPositive()
  @Max(100)
  minRequests: number;

  @ApiProperty({ name: 'max_requests' })
  @IsNumber()
  @IsPositive()
  @Max(100)
  maxRequests: number;

  @ApiProperty()
  @IsDefined()
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

export type CreateJob =
  | JobQuickLaunchDto
  | JobFortuneDto
  | JobCvatDto
  | JobCaptchaDto;
