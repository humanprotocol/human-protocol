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
    const stats = new AssignmentStatsDto();

    const assignments = await this.assignmentRepository.find({
      where: { workerAddress },
    });

    stats.assignments_total = assignments.length;
    stats.submissions_sent = 0;
    stats.assignments_completed = 0;
    stats.assignments_rejected = 0;
    stats.assignments_expired = 0;

    assignments.forEach((a) => {
      switch (a.status) {
        case AssignmentStatus.VALIDATION:
          stats.submissions_sent += 1;
          break;
        case AssignmentStatus.COMPLETED:
          stats.assignments_completed += 1;
          break;
        case AssignmentStatus.REJECTED:
          stats.assignments_rejected += 1;
          break;
        case AssignmentStatus.EXPIRED:
          stats.assignments_expired += 1;
          break;
      }
    });

    return stats;
  }
}