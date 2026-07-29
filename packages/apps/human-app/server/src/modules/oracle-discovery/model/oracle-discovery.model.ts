import { ChainId } from '@human-protocol/sdk';
import { AutoMap } from '@automapper/classes';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

type DiscoveredOracleCreateProps = {
  id: string;
  address: string;
  chainId: ChainId;
  stakedAmount: bigint | null;
  lockedAmount: bigint | null;
  lockedUntilTimestamp: number | null;
  withdrawnAmount: bigint | null;
  slashedAmount: bigint | null;
  amountJobsProcessed: bigint | null;
  role: string;
  fee: bigint | null;
  publicKey: string | null;
  webhookUrl: string | null;
  website: string | null;
  url: string;
  jobTypes: string[] | null;
  registrationNeeded: boolean | null;
  registrationInstructions: string | null;
  reputationNetworks: string[];
  name: string;
  category: string | null;
};

export class DiscoveredOracle {
  id: string;
  address: string;
  chainId: ChainId;
  stakedAmount?: string;
  lockedAmount?: string;
  lockedUntilTimestamp?: string;
  withdrawnAmount?: string;
  slashedAmount?: string;
  amountJobsProcessed?: string;
  fee?: string;
  publicKey?: string;
  webhookUrl?: string;
  website?: string;
  url: string;
  role: string;
  jobTypes: string[];
  registrationNeeded?: boolean;
  registrationInstructions?: string;
  reputationNetworks?: string[];
  name: string;
  category?: string;
  retriesCount = 0;
  executionsToSkip = 0;

  constructor(props: DiscoveredOracleCreateProps) {
    this.id = props.id;
    this.address = props.address;
    this.chainId = props.chainId;
    this.registrationNeeded = props.registrationNeeded ?? undefined;
    this.role = props.role;
    this.url = props.url;
    this.name = props.name;
    this.fee = props.fee?.toString();
    this.publicKey = props.publicKey ?? undefined;
    this.webhookUrl = props.webhookUrl ?? undefined;
    this.website = props.website ?? undefined;
    this.category = props.category ?? undefined;
    this.registrationInstructions = props.registrationInstructions ?? undefined;
    this.jobTypes = props.jobTypes ?? [];
    this.reputationNetworks = props.reputationNetworks ?? undefined;
    this.stakedAmount = props.stakedAmount?.toString();
    this.lockedAmount = props.lockedAmount?.toString();
    this.withdrawnAmount = props.withdrawnAmount?.toString();
    this.slashedAmount = props.slashedAmount?.toString();
    this.amountJobsProcessed = props.amountJobsProcessed?.toString();
    this.lockedUntilTimestamp = props.lockedUntilTimestamp?.toString();
  }
}

export class GetOraclesQuery {
  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : Array(value)))
  selected_job_types?: string[];
}

export class GetOraclesCommand {
  @AutoMap()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  selectedJobTypes?: string[];
}

export class GetOraclesResponseItem {
  @ApiProperty({ description: 'Unique identifier of the oracle operator' })
  id: string;

  @ApiProperty({ description: 'Address of the oracle operator' })
  address: string;

  @ApiProperty({ description: 'Chain ID where the oracle is registered' })
  chainId: ChainId;

  @ApiProperty({ description: 'Role of the oracle operator' })
  role: string;

  @ApiProperty({ description: 'URL of the oracle operator' })
  url: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Types of jobs the oracle supports',
  })
  jobTypes: string[];

  @ApiPropertyOptional({ description: 'Indicates if registration is needed' })
  registrationNeeded?: boolean;

  @ApiPropertyOptional({
    description: 'Instructions for registration, if needed',
  })
  registrationInstructions?: string;

  @ApiProperty({ description: 'Name of the operator' })
  name: string;

  @ApiPropertyOptional({ description: 'Category of the operator' })
  category?: string;

  @ApiProperty()
  nTasks: number;

  @ApiProperty()
  minRewardAmount: string;

  @ApiProperty()
  maxRewardAmount: string;

  @ApiProperty()
  rewardToken: string;
}
