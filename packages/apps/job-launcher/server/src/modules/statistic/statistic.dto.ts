import { ApiProperty } from '@nestjs/swagger';

export class JobCountDto {
  @ApiProperty({ type: 'number' })
  totalJobs: number;

  @ApiProperty({ type: 'number' })
  launched: number;

  @ApiProperty({ type: 'number' })
  partial: number;

  @ApiProperty({ type: 'number' })
  completed: number;

  @ApiProperty({ type: 'number' })
  canceled: number;
}

export class FundAmountStatisticsDto {
  @ApiProperty({ type: 'number' })
  average: number;

  @ApiProperty({ type: 'number' })
  maximum: number;

  @ApiProperty({ type: 'number' })
  minimum: number;
}

export class JobStatusPerDayDto {
  @ApiProperty({ type: 'string' })
  date: string;

  @ApiProperty({ type: 'number' })
  launched: number;

  @ApiProperty({ type: 'number' })
  partial: number;

  @ApiProperty({ type: 'number' })
  completed: number;

  @ApiProperty({ type: 'number' })
  canceled: number;
}

export class JobStatisticsDto {
  @ApiProperty({ type: 'number' })
  averageCompletionTime: number;

  @ApiProperty({ type: JobCountDto })
  jobCounts: JobCountDto;

  @ApiProperty({ type: FundAmountStatisticsDto })
  fundAmountStats: FundAmountStatisticsDto;

  @ApiProperty({ type: [JobStatusPerDayDto] })
  jobsByStatusPerDay: JobStatusPerDayDto[];
}
