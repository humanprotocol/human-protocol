import { ApiProperty } from '@nestjs/swagger';

export class ActiveProposalResponse {
  @ApiProperty()
  proposalId: string;

  @ApiProperty()
  forVotes: number;

  @ApiProperty()
  againstVotes: number;

  @ApiProperty()
  abstainVotes: number;

  @ApiProperty({ description: 'Deadline timestamp (seconds)' })
  deadline: number;
}
