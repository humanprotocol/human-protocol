import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StakeSummaryResponseDto {
  @ApiProperty({ name: 'exchange_stake' })
  exchangeStake: string;

  @ApiProperty({ name: 'on_chain_stake' })
  onChainStake: string;

  @ApiPropertyOptional({ name: 'exchange_error' })
  exchangeError?: string;

  @ApiPropertyOptional({ name: 'on_chain_error' })
  onChainError?: string;
}

export class StakeConfigResponseDto {
  @ApiProperty({ name: 'min_threshold' })
  minThreshold: string;

  @ApiProperty({ name: 'eligibility_enabled' })
  eligibilityEnabled: boolean;
}
