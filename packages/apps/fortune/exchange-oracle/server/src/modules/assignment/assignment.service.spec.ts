import { AssignmentService } from './assignment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AssignmentEntity } from './assignment.entity';
import { Repository } from 'typeorm';
import { AssignmentStatus } from '../../common/enums/job';
