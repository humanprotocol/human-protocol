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
      activeEscrows: await this.jobRepository.countJobsByStatus(
        JobStatus.ACTIVE,
      ),
      completedEscrows: await this.jobRepository.countJobsByStatus(
        JobStatus.COMPLETED,
      ),
      canceledEscrows: await this.jobRepository.countJobsByStatus(
        JobStatus.CANCELED,
      ),
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
