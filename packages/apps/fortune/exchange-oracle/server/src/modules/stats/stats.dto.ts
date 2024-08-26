import { ApiProperty } from '@nestjs/swagger';

export class OracleStatsDto {
  @ApiProperty({
    name: 'workers_total',
  })
  workersTotal: number;

  @ApiProperty({
    name: 'assignments_completed',
  })
  assignmentsCompleted: number;

  @ApiProperty({
    name: 'assignments_rejected',
  })
  assignmentsRejected: number;

  @ApiProperty({
    name: 'assignments_expired',
  })
  assignmentsExpired: number;
  
  @ApiProperty({
    name: 'escrows_processed',
  })
  escrowsProcessed: number;

  @ApiProperty({
    name: 'escrows_active',
  })
  escrowsActive: number;

  @ApiProperty({
    name: 'escrows_cancelled',
  })
  escrowsCancelled: number;

  constructor(init?: Partial<OracleStatsDto>) {
    Object.assign(this, init);
  }
}
export class AssignmentStatsDto {
  @ApiProperty({
    name: 'assignments_total',
  })
  assignmentsTotal: number;

  @ApiProperty({
    name: 'submissions_sent',
  })
  submissionsSent: number;

  @ApiProperty({
    name: 'assignments_completed',
  })
  assignmentsCompleted: number;

  @ApiProperty({
    name: 'assignments_rejected',
  })
  assignmentsRejected: number;

  @ApiProperty({
    name: 'assignments_expired',
  })
  assignmentsExpired: number;

  constructor(init?: Partial<AssignmentStatsDto>) {
    Object.assign(this, init);
  }
}
