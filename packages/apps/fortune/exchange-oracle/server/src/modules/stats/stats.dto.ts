export class StatsDto {
  assignmentsTotal: number;
  submissionsSent: number;
  assignmentsCompleted: number;
  assignmentsRejected: number;
  assignmentsExpired: number;

  constructor(init?: Partial<StatsDto>) {
    Object.assign(this, init);
  }
}
