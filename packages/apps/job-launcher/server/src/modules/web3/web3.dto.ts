import { IOperator } from '@human-protocol/sdk';
import { ApiProperty } from '@nestjs/swagger';

export class OracleDataDto implements IOperator {
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
