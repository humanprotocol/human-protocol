import { ApiProperty } from '@nestjs/swagger';

export class ProposalResponse {
  @ApiProperty()
  proposalId: string;

  @ApiProperty()
  forVotes: number;

  @ApiProperty()
  againstVotes: number;

  @ApiProperty()
  abstainVotes: number;

  @ApiProperty({ description: 'Voting start timestamp (seconds)' })
  voteStart: number;

  @ApiProperty({ description: 'Voting end timestamp (seconds)' })
  voteEnd: number;
}
