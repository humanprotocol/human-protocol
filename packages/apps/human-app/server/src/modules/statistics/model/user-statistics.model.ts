import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UserStatisticsResponse {
  assignments_amount: number;
  submissions_sent: number;
  assignments_completed: number;
  assignments_rejected: number;
  assignments_expired: number;
}
export class UserStatisticsCommand {
  oracleAddress: string;
  token: string;
}
export class UserStatisticsDto {
  @ApiProperty({ example: 'string' })
  @IsString()
  oracle_address: string;
}
export class UserStatisticsDetails {
  exchangeOracleUrl: string;
  token: string;
}
