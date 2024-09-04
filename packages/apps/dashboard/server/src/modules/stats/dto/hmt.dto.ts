import { ApiProperty } from '@nestjs/swagger';

export class HmtDailyStatsData {
  @ApiProperty({ example: '2024-05-01' })
  public date: Date;
  @ApiProperty()
  public totalTransactionAmount: bigint;
  @ApiProperty()
  public totalTransactionCount: number;
  @ApiProperty()
  public dailyUniqueSenders: number;
  @ApiProperty()
  public dailyUniqueReceivers: number;
}

export class HmtDailyStatsResponseDto {
  @ApiProperty({ example: '2024-05-01' })
  public from: string;

  @ApiProperty({ example: '2024-05-01' })
  public to: string;

  @ApiProperty({ isArray: true, type: HmtDailyStatsData })
  public results: HmtDailyStatsData[];
}
