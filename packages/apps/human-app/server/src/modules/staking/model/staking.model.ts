import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ name: 'eligibility_enabled' })
  @AutoMap()
  eligibilityEnabled: boolean;

  @ApiProperty({ name: 'exchange_error', required: false, nullable: true })
  @AutoMap()
  exchangeError?: string;

  @ApiProperty({ name: 'on_chain_error', required: false, nullable: true })
  @AutoMap()
  onChainError?: string;
}
