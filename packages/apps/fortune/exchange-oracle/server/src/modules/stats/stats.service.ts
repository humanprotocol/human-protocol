import { Injectable, Logger } from '@nestjs/common';
import { JobRepository } from '../job/job.repository';
import { AssignmentRepository } from '../assignment/assignment.repository';
import { AssignmentStatsDto, OracleStatsDto } from './stats.dto';
import { JobStatus } from '../../common/enums/job';

@Injectable()
export class StatsService {
  public readonly logger = new Logger(StatsService.name);
  constructor(
    private jobRepository: JobRepository,
    private assignmentRepository: AssignmentRepository,
  ) {}

  async getOracleStats(): Promise<OracleStatsDto> {
    return new OracleStatsDto({
      workersTotal: await this.assignmentRepository.countTotalWorkers(),
      assignmentsCompleted:
        await this.assignmentRepository.countCompletedAssignments(),
      assignmentsRejected:
        await this.assignmentRepository.countRejectedAssignments(),
      assignmentsExpired:
        await this.assignmentRepository.countExpiredAssignments(),
      escrowsProcessed: await this.jobRepository.countJobsByStatus(
        JobStatus.COMPLETED,
      ),
      escrowsActive: await this.jobRepository.countJobsByStatus(
        JobStatus.ACTIVE,
      ),
      escrowsCancelled: await this.jobRepository.countJobsByStatus(
        JobStatus.CANCELED,
      ),
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
