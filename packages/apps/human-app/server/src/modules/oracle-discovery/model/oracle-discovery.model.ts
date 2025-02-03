import { ChainId, IOperator } from '@human-protocol/sdk';
import { AutoMap } from '@automapper/classes';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';
import { Exclude, Transform } from 'class-transformer';

type DiscoveredOracleCreateProps = {
  id: string;
  address: string;
  chainId: ChainId;
  amountStaked: bigint;
  amountLocked: bigint;
  lockedUntilTimestamp: bigint;
  amountWithdrawn: bigint;
  amountSlashed: bigint;
  reward: bigint;
  amountJobsProcessed: bigint;
  role?: string;
  fee?: bigint;
  publicKey?: string;
  webhookUrl?: string;
  website?: string;
  url: string;
  jobTypes: string[];
  registrationNeeded?: boolean;
  registrationInstructions?: string;
  reputationNetworks?: string[];
  name?: string;
  category?: string;
};

export class DiscoveredOracle implements IOperator {
  @ApiProperty({ description: 'Unique identifier of the oracle operator' })
  id: string;

  @ApiProperty({ description: 'Address of the oracle operator' })
  address: string;

  @ApiProperty({ description: 'Chain ID where the oracle is registered' })
  chainId: ChainId;

  @ApiProperty({ description: 'Amount staked by the operator' })
  amountStaked: bigint;

  @ApiProperty({ description: 'Amount currently locked by the operator' })
  amountLocked: bigint;

  @ApiProperty({ description: 'Timestamp until funds are locked' })
  lockedUntilTimestamp: bigint;

  @ApiProperty({ description: 'Total amount withdrawn by the operator' })
  amountWithdrawn: bigint;

  @ApiProperty({ description: 'Total amount slashed from the operator' })
  amountSlashed: bigint;

  @ApiProperty({ description: 'Total reward earned by the operator' })
  reward: bigint;

  @ApiProperty({ description: 'Number of jobs processed by the operator' })
  amountJobsProcessed: bigint;

  @ApiPropertyOptional({ description: 'Fee charged by the operator' })
  fee?: bigint;

  @ApiPropertyOptional({ description: 'Public key of the operator' })
  publicKey?: string;

  @ApiPropertyOptional({ description: 'Webhook URL of the operator' })
  webhookUrl?: string;

  @ApiPropertyOptional({ description: 'Website of the operator' })
  website?: string;

  @ApiPropertyOptional({ description: 'URL of the oracle operator' })
  url: string;

  @ApiPropertyOptional({ description: 'Role of the oracle operator' })
  role?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Types of jobs the oracle supports',
  })
  jobTypes: string[];

  @ApiPropertyOptional({ description: 'Indicates if registration is needed' })
  registrationNeeded: boolean;

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
    Object.assign(this, props);
    this.registrationNeeded = props.registrationNeeded || false;
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
