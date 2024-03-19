import { Injectable, Logger } from '@nestjs/common';
import { AssignmentRepository } from '../assignment/assignment.repository';
import { StatsDto } from './stats.dto';
import { AssignmentStatus } from '../../common/enums/job';

@Injectable()
export class StatsService {
  public readonly logger = new Logger(StatsService.name);
  constructor(private assignmentRepository: AssignmentRepository) {}

  async getAssignmentStats(workerAddress: string): Promise<StatsDto> {
    const assignments = await this.assignmentRepository.find({
      where: { workerAddress },
    });

    const stats = assignments.reduce(
      (acc, assignment) => {
        acc.assignmentsTotal += 1;

        switch (assignment.status) {
          case AssignmentStatus.VALIDATION:
            acc.submissionsSent += 1;
            break;
          case AssignmentStatus.COMPLETED:
            acc.assignmentsCompleted += 1;
            break;
          case AssignmentStatus.REJECTED:
            acc.assignmentsRejected += 1;
            break;
          case AssignmentStatus.EXPIRED:
            acc.assignmentsExpired += 1;
            break;
        }

        return acc;
      },
      {
        assignmentsTotal: 0,
        submissionsSent: 0,
        assignmentsCompleted: 0,
        assignmentsRejected: 0,
        assignmentsExpired: 0,
      },
    );

    return new StatsDto(stats);
  }
}
