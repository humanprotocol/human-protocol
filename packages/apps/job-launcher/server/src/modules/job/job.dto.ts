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
  IsNumberString,
  Min,
  IsNotEmpty,
  IsEthereumAddress,
} from 'class-validator';
import { ChainId } from '@human-protocol/sdk';
import { JobRequestType, JobStatus } from '../../common/enums/job';
import { EventType } from '../../common/enums/webhook';
import { BigNumber } from 'ethers';
import { AWSRegions, StorageProviders } from 'src/common/enums/storage';
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
  @IsPositive()
  public submissionsRequired: number;
}

export class storageDataDto {
  @ApiProperty({ enum: StorageProviders })
  @IsEnum(StorageProviders)
  public provider: StorageProviders;
  @ApiProperty({ enum: AWSRegions })
  @IsEnum(AWSRegions)
  public region: AWSRegions | null;
  public bucketName: string;
  public path: string;
}

export class JobCvatDto extends JobDto {
  @ApiProperty()
  @IsObject()
  public data: storageDataDto;

  @ApiProperty()
  @IsArray()
  public labels: string[];

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public minQuality: number;

  @ApiProperty()
  @IsObject()
  public groundTruth: storageDataDto;

  @ApiProperty()
  @IsUrl()
  public userGuide: string;

  @ApiProperty({ enum: JobRequestType })
  @IsEnum(JobRequestType)
  public type: JobRequestType;
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
  public amountRefunded: BigNumber;
}
