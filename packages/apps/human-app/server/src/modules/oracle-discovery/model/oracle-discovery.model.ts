import { ChainId } from '@human-protocol/sdk';
import { AutoMap } from '@automapper/classes';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';
import { Exclude, Transform } from 'class-transformer';

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
  role: string | null;
  fee: bigint | null;
  publicKey: string | null;
  webhookUrl: string | null;
  website: string | null;
  url: string | null;
  jobTypes: string[] | null;
  registrationNeeded: boolean | null;
  registrationInstructions: string | null;
  reputationNetworks: string[];
  name: string | null;
  category: string | null;
};

export class DiscoveredOracle {
  @ApiProperty({ description: 'Unique identifier of the oracle operator' })
  id: string;

  @ApiProperty({ description: 'Address of the oracle operator' })
  address: string;

  @ApiProperty({ description: 'Chain ID where the oracle is registered' })
  chainId: ChainId;

  @ApiPropertyOptional({ description: 'Amount staked by the operator' })
  stakedAmount?: string;

  @ApiPropertyOptional({
    description: 'Amount currently locked by the operator',
  })
  lockedAmount?: string;

  @ApiPropertyOptional({ description: 'Timestamp until funds are locked' })
  lockedUntilTimestamp?: string;

  @ApiPropertyOptional({
    description: 'Total amount withdrawn by the operator',
  })
  withdrawnAmount?: string;

  @ApiPropertyOptional({
    description: 'Total amount slashed from the operator',
  })
  slashedAmount?: string;

  @ApiPropertyOptional({
    description: 'Number of jobs processed by the operator',
  })
  amountJobsProcessed?: string;

  @ApiPropertyOptional({ description: 'Fee charged by the operator' })
  fee?: bigint;

  @ApiPropertyOptional({ description: 'Public key of the operator' })
  publicKey?: string;

  @ApiPropertyOptional({ description: 'Webhook URL of the operator' })
  webhookUrl?: string;

  @ApiPropertyOptional({ description: 'Website of the operator' })
  website?: string;

  @ApiPropertyOptional({ description: 'URL of the oracle operator' })
  url?: string;

  @ApiPropertyOptional({ description: 'Role of the oracle operator' })
  role?: string;

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

  @ApiPropertyOptional({
    type: [String],
    description: 'Reputation networks the operator belongs to',
  })
  reputationNetworks?: string[];

  @ApiPropertyOptional({ description: 'Name of the operator' })
  name?: string;

  @ApiPropertyOptional({ description: 'Category of the operator' })
  category?: string;

  @Exclude()
  retriesCount = 0;

  @Exclude()
  executionsToSkip = 0;

  constructor(props: DiscoveredOracleCreateProps) {
    this.id = props.id;
    this.address = props.address;
    this.chainId = props.chainId;
    this.registrationNeeded = props.registrationNeeded ?? undefined;
    this.role = props.role ?? undefined;
    this.url = props.url ?? undefined;
    this.name = props.name ?? undefined;
    this.fee = props.fee ?? undefined;
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
