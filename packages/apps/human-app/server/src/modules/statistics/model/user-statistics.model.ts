import { ApiProperty } from '@nestjs/swagger';

export class UserStatisticsResponse {
  assignments_amount: number;
  submissions_sent: number;
  assignments_completed: number;
  assignments_rejected: number;
  assignments_expired: number;
}
export class UserStatisticsCommand {
  address: string;
  token: string;
}
export class UserStatisticsDto {
  @ApiProperty({ example: 'string' })
  address: string;
}
export class UserStatisticsDetails {
  exchangeOracleUrl: string;
  token: string;
}
