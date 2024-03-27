import { ApiProperty } from '@nestjs/swagger';

export class UserStatisticsResponse {
  assignments_amount: number;
  submissions_sent: number;
  assignments_completed: number;
  assignments_rejected: number;
  assignments_expired: number;
}
export class UserStatisticsCommand {
  exchangeOracleUrl: string;
  token: string;
}
export class UserStatisticsDto {
  @ApiProperty({ example: 'string' })
  exchangeOracleUrl: string;
}
