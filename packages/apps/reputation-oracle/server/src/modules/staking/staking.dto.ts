import { ApiProperty } from '@nestjs/swagger';

export class StakeSummaryResponseDto {
  @ApiProperty({ name: 'exchange_stake' })
  exchangeStake: string;

  @ApiProperty({ name: 'on_chain_stake' })
  onChainStake: string;

  @ApiProperty({ name: 'min_threshold' })
  minThreshold: string;

  @ApiProperty({ name: 'exchange_error', required: false, nullable: true })
  exchangeError?: string;

  @ApiProperty({ name: 'on_chain_error', required: false, nullable: true })
  onChainError?: string;
}
