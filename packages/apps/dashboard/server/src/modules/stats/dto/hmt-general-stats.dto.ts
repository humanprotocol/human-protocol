import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class HmtGeneralStatsDto {
  @ApiProperty({ example: 10000 })
  @IsNumber()
  public totalHolders: number;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  public totalTransactions: number;
}
