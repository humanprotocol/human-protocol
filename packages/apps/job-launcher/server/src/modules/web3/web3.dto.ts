import { ChainId, IOperator } from '@human-protocol/sdk';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class OracleDataDto implements Partial<IOperator> {
  address: string;
  role?: string;
  url?: string;
  jobTypes?: string[];
}

export class AvailableOraclesDto {
  @ApiProperty({
    description: 'List of addresses of exchange oracles',
  })
  exchangeOracles: string[];

  @ApiProperty({
    description: 'List of addresses of recording oracles',
  })
  recordingOracles: string[];
}

export class GetAvailableOraclesDto {
  @ApiProperty({ name: 'chain_id' })
  @IsString()
  chainId: ChainId;

  @ApiProperty({ name: 'job_type' })
  @IsString()
  jobType: string;

  @ApiProperty({ name: 'reputation_oracle_address' })
  @IsString()
  reputationOracleAddress: string;
}

export class GetReputationOraclesDto {
  @ApiProperty({ name: 'chain_id' })
  @IsString()
  chainId: ChainId;

  @ApiProperty({ name: 'job_type' })
  @IsString()
  jobType: string;
}
