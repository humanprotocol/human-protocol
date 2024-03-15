import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignmentEntity } from './assignment.entity';
import { AssignmentStatsDto } from './assignment.dto';
import { AssignmentStatus } from '../../common/enums/job';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectRepository(AssignmentEntity)
    private assignmentRepository: Repository<AssignmentEntity>,
  ) {}

  async getAssignmentStats(workerAddress: string): Promise<AssignmentStatsDto> {
    const assignments = await this.assignmentRepository.find({
      where: { workerAddress },
    });

    const initialStats = {
      assignments_total: 0,
      submissions_sent: 0,
      assignments_completed: 0,
      assignments_rejected: 0,
      assignments_expired: 0,
    };

    const stats = assignments.reduce((acc, assignment) => {
      acc.assignments_total += 1;

      switch (assignment.status) {
        case AssignmentStatus.VALIDATION:
          acc.submissions_sent += 1;
          break;
        case AssignmentStatus.COMPLETED:
          acc.assignments_completed += 1;
          break;
        case AssignmentStatus.REJECTED:
          acc.assignments_rejected += 1;
          break;
        case AssignmentStatus.EXPIRED:
          acc.assignments_expired += 1;
          break;
      }

      return acc;
    }, initialStats);

    const finalStats = new AssignmentStatsDto();
    finalStats.assignments_total = stats.assignments_total;
    finalStats.submissions_sent = stats.submissions_sent;
    finalStats.assignments_completed = stats.assignments_completed;
    finalStats.assignments_rejected = stats.assignments_rejected;
    finalStats.assignments_expired = stats.assignments_expired;

    return finalStats;
  }
}
