import { ChainId, IOperator } from '@human-protocol/sdk';
import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsString } from 'class-validator';

export class OracleDataDto implements Partial<IOperator> {
  address: string;
  role: string | null;
  url: string | null;
  jobTypes?: string[] | null;
}

export const validChainIds = Object.values(ChainId).filter(
  (value) => typeof value === 'number' && value > 0,
) as number[];

function IsValidChainId() {
  return applyDecorators(
    IsIn(validChainIds),
    Transform(({ value }) => Number(value)),
  );
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
  @ApiProperty({ name: 'chain_id', enum: validChainIds })
  @IsValidChainId()
  chainId: ChainId;

  @ApiProperty({ name: 'job_type' })
  @IsString()
  jobType: string;

  @ApiProperty({ name: 'reputation_oracle_address' })
  @IsString()
  reputationOracleAddress: string;
}

export class GetReputationOraclesDto {
  @ApiProperty({ name: 'chain_id', enum: validChainIds })
  @IsValidChainId()
  chainId: ChainId;

  @ApiProperty({ name: 'job_type' })
  @IsString()
  jobType: string;
}
