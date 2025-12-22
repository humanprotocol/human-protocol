import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StakeSummaryResponse {
  @ApiProperty()
  exchange_stake: number;

  @ApiProperty({ name: 'on_chain_stake' })
  on_chain_stake: number;

  @ApiPropertyOptional()
  exchange_error?: string | null;

  @ApiPropertyOptional()
  on_chain_error?: string | null;
}

export class StakeConfigResponse {
  min_threshold: number;

  eligibility_enabled: boolean;
}
