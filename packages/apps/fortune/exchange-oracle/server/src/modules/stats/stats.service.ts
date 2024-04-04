import { Injectable, Logger } from '@nestjs/common';
import { AssignmentRepository } from '../assignment/assignment.repository';
import { AssignmentStatsDto, OracleStatsDto } from './stats.dto';

@Injectable()
export class StatsService {
  public readonly logger = new Logger(StatsService.name);
  constructor(private assignmentRepository: AssignmentRepository) {}

  async getOracleStats(): Promise<OracleStatsDto> {
    return new OracleStatsDto({
      workersTotal: await this.assignmentRepository.countTotalWorkers(),
      assignmentsCompleted:
        await this.assignmentRepository.countCompletedAssignments(),
      assignmentsExpired:
        await this.assignmentRepository.countExpiredAssignments(),
      assignmentsRejected:
        await this.assignmentRepository.countRejectedAssignments(),
    });
  }
  async getAssignmentStats(workerAddress: string): Promise<AssignmentStatsDto> {
    return new AssignmentStatsDto({
      assignmentsTotal:
        await this.assignmentRepository.countTotalAssignments(workerAddress),
      submissionsSent:
        await this.assignmentRepository.countSentAssignments(workerAddress),
      assignmentsCompleted:
        await this.assignmentRepository.countCompletedAssignments(
          workerAddress,
        ),
      assignmentsExpired:
        await this.assignmentRepository.countExpiredAssignments(workerAddress),
      assignmentsRejected:
        await this.assignmentRepository.countRejectedAssignments(workerAddress),
    });
  }
}
