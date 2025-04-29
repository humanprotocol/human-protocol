import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
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
  JobCaptchaShapeType,
  EscrowFundToken,
  JobRequestType,
  JobSortField,
  JobStatus,
  JobStatusFilter,
  WorkerBrowser,
  WorkerLanguage,
  Country,
} from '../../common/enums/job';
import { Transform } from 'class-transformer';
import { AWSRegions, StorageProviders } from '../../common/enums/storage';
import { PageOptionsDto } from '../../common/pagination/pagination.dto';
import { IsEnumCaseInsensitive } from '../../common/decorators';
import { PaymentCurrency } from '../../common/enums/payment';
import { IsValidToken } from '../../common/validators/tokens';
import { Label, ManifestDetails } from '../manifest/manifest.dto';

export class JobDto {
  @ApiProperty({ enum: ChainId, required: false, name: 'chain_id' })
  @IsEnumCaseInsensitive(ChainId)
  @IsOptional()
  public chainId?: ChainId;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  public qualifications?: string[];

  @ApiPropertyOptional({
    type: String,
    description: 'Address of the reputation oracle',
  })
  @IsEthereumAddress()
  @IsOptional()
  public reputationOracle?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Address of the exchange oracle',
  })
  @IsEthereumAddress()
  @IsOptional()
  public exchangeOracle?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Address of the recording oracle',
  })
  @IsEthereumAddress()
  @IsOptional()
  public recordingOracle?: string;

  @ApiProperty({ enum: PaymentCurrency, name: 'payment_currency' })
  @IsEnumCaseInsensitive(PaymentCurrency)
  public paymentCurrency: PaymentCurrency;

  @ApiProperty({ name: 'payment_amount' })
  @IsNumber()
  @IsPositive()
  public paymentAmount: number;

  @ApiProperty({ enum: EscrowFundToken, name: 'escrow_fund_token' })
  @IsValidToken()
  public escrowFundToken: EscrowFundToken;
}

export class JobQuickLaunchDto extends JobDto {
  @ApiProperty({
    description: 'Request type',
    name: 'request_type',
    enum: JobRequestType,
  })
  @IsEnumCaseInsensitive(JobRequestType)
  public requestType: JobRequestType;

  @ApiProperty({ name: 'manifest_url' })
  @IsUrl()
  @IsNotEmpty()
  public manifestUrl: string;

  @ApiProperty({ name: 'manifest_hash' })
  @IsString()
  @IsOptional()
  public manifestHash: string;
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
}

export class StorageDataDto {
  @ApiProperty({ enum: StorageProviders })
  @IsEnumCaseInsensitive(StorageProviders)
  public provider: StorageProviders;

  @ApiProperty({ enum: AWSRegions })
  @IsEnumCaseInsensitive(AWSRegions)
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

  @ApiProperty({ type: [Label] })
  @IsArray()
  @ArrayMinSize(1)
  public labels: Label[];

  @ApiProperty({ name: 'min_quality' })
  @IsNumber()
  @IsPositive()
  @Max(1)
  public minQuality: number;

  @ApiProperty({ name: 'ground_truth' })
  @IsObject()
  public groundTruth: StorageDataDto;

  @ApiProperty({ name: 'user_guide' })
  @IsUrl()
  public userGuide: string;

  @ApiProperty({ enum: JobRequestType })
  @IsEnumCaseInsensitive(JobRequestType)
  public type: JobRequestType;
}

class AudinoLabel {
  @ApiProperty()
  @IsString()
  public name: string;
}

class AudinoDataDto {
  @ApiProperty()
  @IsObject()
  public dataset: StorageDataDto;
}

export class JobAudinoDto extends JobDto {
  @ApiProperty({ name: 'requester_description' })
  @IsString()
  public requesterDescription: string;

  @ApiProperty()
  @IsObject()
  public data: AudinoDataDto;

  @ApiProperty({ type: [AudinoLabel] })
  @IsArray()
  @ArrayMinSize(1)
  public labels: AudinoLabel[];

  @ApiProperty({ name: 'min_quality' })
  @IsNumber()
  @IsPositive()
  @Max(1)
  public minQuality: number;

  @ApiProperty({ name: 'ground_truth' })
  @IsObject()
  public groundTruth: StorageDataDto;

  @ApiProperty({ name: 'user_guide' })
  @IsUrl()
  public userGuide: string;

  @ApiProperty({ enum: JobRequestType })
  @IsEnumCaseInsensitive(JobRequestType)
  public type: JobRequestType;

  @ApiProperty({ name: 'audio_duration' })
  @IsNumber()
  @IsPositive()
  public audioDuration: number;

  @ApiProperty({ name: 'segment_duration' })
  @IsNumber()
  @IsPositive()
  public segmentDuration: number;
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

class CommonDetails {
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
    description: 'Currency of the job',
  })
  @IsEnumCaseInsensitive(EscrowFundToken)
  public currency?: EscrowFundToken;

  @ApiProperty({
    description: 'Number of tasks (optional)',
    name: 'amount_of_tasks',
  })
  @IsNumber()
  public amountOfTasks?: number;

  @ApiProperty({ description: 'Status of the job' })
  @IsEnumCaseInsensitive(JobStatus)
  public status: JobStatus;

  @ApiProperty({
    description: 'Reason for job failure',
    name: 'failed_reason',
  })
  @IsString()
  public failedReason: string | null;
}

export class JobDetailsDto {
  @ApiProperty({ description: 'Details of the job' })
  @IsNotEmpty()
  public details: CommonDetails;

  @ApiProperty({ description: 'Manifest details' })
  @IsNotEmpty()
  public manifest: ManifestDetails;
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
  public currency: EscrowFundToken;

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
  @IsEnumCaseInsensitive(JobSortField)
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
  @IsEnumCaseInsensitive(JobStatusFilter)
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
  @IsEnumCaseInsensitive(WorkerLanguage)
  @IsOptional()
  workerLanguage?: WorkerLanguage;

  @ApiProperty({
    enum: Country,
    name: 'worker_location',
  })
  @IsEnumCaseInsensitive(Country)
  @IsOptional()
  workerLocation?: Country;

  @ApiProperty({
    enum: WorkerBrowser,
    name: 'target_browser',
  })
  @IsEnumCaseInsensitive(WorkerBrowser)
  @IsOptional()
  targetBrowser?: WorkerBrowser;
}

class JobCaptchaAnnotationsDto {
  @ApiProperty({
    enum: JobCaptchaShapeType,
    name: 'type_of_job',
  })
  @IsEnumCaseInsensitive(JobCaptchaShapeType)
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

export type CreateJob = JobQuickLaunchDto | JobFortuneDto | JobCvatDto;
// | JobCaptchaDto;
