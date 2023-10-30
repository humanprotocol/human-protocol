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
  IsNumberString,
  Min,
  IsNotEmpty,
  IsEthereumAddress,
} from 'class-validator';
import { ChainId } from '@human-protocol/sdk';
import { JobRequestType, JobStatus } from '../../common/enums/job';
import { EventType } from '../../common/enums/webhook';
import { BigNumber } from 'ethers';
import { Exchange } from '../../common/enums/exchange';

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

  @ApiProperty()
  @IsString()
  public requesterDescription: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public fundAmount: number;
}

export class JobCampaignDto extends JobDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public startBlock: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public endBlock: number;

  @ApiProperty()
  @IsString()
  @IsEnum(Exchange)
  public exchangeName: Exchange;

  @ApiProperty()
  @IsString()
  public tokenA: string;

  @ApiProperty()
  @IsString()
  public tokenB: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public campaignDuration: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public fundAmount: number;

  @ApiProperty()
  @IsEnum(JobRequestType)
  type: JobRequestType;
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

export class CampaignManifestDto {
  @IsNumber()
  @IsPositive()
  startBlock: number;
  @IsNumber()
  @IsPositive()
  endBlock: number;

  @IsString()
  @IsEnum(Exchange)
  exchangeName: Exchange;

  @IsString()
  tokenA: string;
  @IsString()
  tokenB: string;

  @IsNumber()
  @IsPositive()
  campaignDuration: number;

  @IsNumber()
  @IsPositive()
  fundAmount: number;

  @IsString()
  requesterDescription: string; // address of launcher

  @IsEnum(JobRequestType)
  requestType: JobRequestType;
}

export class ManifestDetails extends CampaignManifestDto {
  @IsNumber()
  @Min(1)
  chainId: number;

  @IsEthereumAddress()
  tokenAddress: string;

  @IsEthereumAddress()
  requesterAddress: string;

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

export class CampaignFinalResultDto {
  @IsString()
  exchangeAddress: string;

  @IsString()
  workerIdentifier: string; // worker address for DEX or read only API key encrypted for CEX

  @IsString()
  liquidityScore: string;
}