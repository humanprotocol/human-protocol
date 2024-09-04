import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { AutoMap } from '@automapper/classes';

export class OracleStatisticsResponse {
  workers_total: number;
  assignments_completed: number;
  assignments_rejected: number;
  assignments_expired: number;
  escrows_processed: number;
  escrows_active: number;
  escrows_cancelled: number;
}
export class OracleStatisticsCommand {
  @AutoMap()
  oracleAddress: string;
}

export class OracleStatisticsDto {
  @IsString()
  @ApiProperty({ example: 'string' })
  @AutoMap()
  oracle_address: string;
}

