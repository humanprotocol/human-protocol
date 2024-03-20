export class OracleStatsDto {
  workersTotal: number;
  assignmentsCompleted: number;
  assignmentsRejected: number;
  assignmentsExpired: number;

  constructor(init?: Partial<OracleStatsDto>) {
    Object.assign(this, init);
  }
}
export class AssignmentStatsDto {
  assignmentsTotal: number;
  submissionsSent: number;
  assignmentsCompleted: number;
  assignmentsRejected: number;
  assignmentsExpired: number;

  constructor(init?: Partial<AssignmentStatsDto>) {
    Object.assign(this, init);
  }
}
