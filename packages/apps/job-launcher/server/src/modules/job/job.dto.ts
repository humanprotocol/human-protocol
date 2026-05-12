import { ChainId } from '@human-protocol/sdk';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEthereumAddress,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  IsUrl,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { IsEnumCaseInsensitive } from '../../common/decorators';
import {
  EscrowFundToken,
  JobRequestType,
  JobSortField,
  JobStatus,
  JobStatusFilter,
  JobType,
} from '../../common/enums/job';
import { PaymentCurrency } from '../../common/enums/payment';
import { AWSRegions, StorageProviders } from '../../common/enums/storage';
import { PageOptionsDto } from '../../common/pagination/pagination.dto';
import { IsValidTokenDecimals } from '../../common/validators/token-decimals';
import { IsValidToken } from '../../common/validators/tokens';
import { ManifestDetails, ManifestDto } from '../manifest/manifest.dto';

export class JobDto {
  @ApiProperty({ enum: ChainId, name: 'chain_id' })
  @IsEnumCaseInsensitive(ChainId)
  public chainId: ChainId;

  @ApiProperty({
    description: 'Request type',
    name: 'request_type',
    enum: JobType,
  })
  @IsEnumCaseInsensitive(JobType)
  public requestType: JobRequestType;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  public qualifications?: string[];

  @ApiPropertyOptional({
    type: String,
    name: 'reputation_oracle',
    description: 'Address of the reputation oracle',
  })
  @IsEthereumAddress()
  @IsOptional()
  public reputationOracle?: string;

  @ApiPropertyOptional({
    type: String,
    name: 'exchange_oracle',
    description: 'Address of the exchange oracle',
  })
  @IsEthereumAddress()
  @IsOptional()
  public exchangeOracle?: string;

  @ApiPropertyOptional({
    type: String,
    name: 'recording_oracle',
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
  @IsValidTokenDecimals('paymentCurrency')
  public paymentAmount: number;

  @ApiProperty({ enum: EscrowFundToken, name: 'escrow_fund_token' })
  @IsValidToken()
  public escrowFundToken: EscrowFundToken;
}

export class JobQuickLaunchDto extends JobDto {
  @ApiProperty({ name: 'manifest_url' })
  @IsUrl()
  @IsNotEmpty()
  public manifestUrl: string;

  @ApiProperty({ name: 'manifest_hash' })
  @IsString()
  @IsOptional()
  public manifestHash?: string;
}

export class JobManifestDto extends JobDto {
  @ApiProperty({ type: Object })
  @IsObject()
  @IsNotEmpty()
  public manifest: ManifestDto;
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
  @IsNotEmpty()
  public bucketName: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  public path?: string;
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
  @ValidateNested()
  @Type(() => CommonDetails)
  public details: CommonDetails;

  @ApiProperty({ description: 'Manifest details' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ManifestDetails)
  public manifest: ManifestDetails;
}

export class FortuneFinalResultDto {
  @ApiProperty({ name: 'worker_address' })
  @IsNotEmpty()
  @IsEthereumAddress()
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

export type CreateJob = JobQuickLaunchDto | JobManifestDto;
