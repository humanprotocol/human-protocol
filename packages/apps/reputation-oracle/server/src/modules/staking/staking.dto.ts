import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StakeSummaryResponseDto {
  @ApiProperty({ name: 'exchange_stake' })
  exchangeStake: string;

  @ApiProperty({ name: 'on_chain_stake' })
  onChainStake: string;

  @ApiProperty({ name: 'min_threshold' })
  minThreshold: string;

  @ApiPropertyOptional({ name: 'exchange_error' })
  exchangeError?: string;

  @ApiPropertyOptional({ name: 'on_chain_error' })
  onChainError?: string;
}
