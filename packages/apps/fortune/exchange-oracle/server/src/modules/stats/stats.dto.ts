import { ApiProperty } from '@nestjs/swagger';

export class OracleStatsDto {
  @ApiProperty({
    name: 'active_escrows',
  })
  activeEscrows: number;

  @ApiProperty({
    name: 'completed_escrows',
  })
  completedEscrows: number;

  @ApiProperty({
    name: 'canceled_escrows',
  })
  canceledEscrows: number;

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
