import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class EnrollExchangeApiKeysDto {
  @AutoMap()
  @IsString()
  @ApiProperty()
  apiKey: string;

  @AutoMap()
  @IsString()
  @ApiProperty()
  secretKey: string;
}

export class EnrollExchangeApiKeysCommand {
  @AutoMap()
  apiKey: string;
  @AutoMap()
  secretKey: string;
  token: string;
  exchangeName: string;
}

export class EnrollExchangeApiKeysData {
  @AutoMap()
  apiKey: string;
  @AutoMap()
  secretKey: string;
}

export class RetrieveExchangeApiKeysResponse {
  apiKey: string;
  exchangeName: string;
}

export class StakeSummaryResponse {
  @ApiProperty({ name: 'exchange_stake' })
  @AutoMap()
  exchangeStake: number;

  @ApiProperty({ name: 'on_chain_stake' })
  @AutoMap()
  onChainStake: number;

  @ApiProperty({ name: 'min_threshold' })
  @AutoMap()
  minThreshold: number;
}
