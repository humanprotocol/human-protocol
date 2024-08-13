import { IOperator } from '@human-protocol/sdk';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class OracleDiscoveryDto implements IOperator {
  address: string;
  role?: string;
  url?: string;
  jobTypes?: string[];
}

export class AvaliableOraclesDto {
  @ApiProperty({
    description: 'List of addresses of exchange oracles',
  })
  @IsArray()
  exchangeOracles: string[];

  @ApiProperty({
    description: 'List of addresses of recording oracles',
  })
  recordingOracles: string[];
}
