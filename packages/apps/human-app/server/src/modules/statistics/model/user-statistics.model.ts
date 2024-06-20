import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { AutoMap } from '@automapper/classes';

export class UserStatisticsResponse {
  assignments_amount: number;
  submissions_sent: number;
  assignments_completed: number;
  assignments_rejected: number;
  assignments_expired: number;
}
export class UserStatisticsCommand {
  @AutoMap()
  oracleAddress: string;
  token: string;
}
export class UserStatisticsDto {
  @ApiProperty({ example: 'string' })
  @IsString()
  @AutoMap()
  oracle_address: string;
}
