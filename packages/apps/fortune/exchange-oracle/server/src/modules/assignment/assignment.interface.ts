import { SortDirection } from '../../common/enums/collection';
import { AssignmentSortField, AssignmentStatus } from '../../common/enums/job';
import { AssignmentEntity } from './assignment.entity';
import { JobType } from '../../common/enums/job';

export interface AssignmentFilterData {
  chainId?: number;
  assignmentId?: string;
  escrowAddress?: string;
  status?: AssignmentStatus;
  sortField?: AssignmentSortField;
  rewardAmount?: AssignmentSortField;
  sort?: SortDirection;
  skip: number;
  pageSize: number;
  workerAddress: string;
  reputationNetwork: string;
  jobType?: JobType;
  createdAfter?: Date;
  updatedAfter?: Date;
}

export interface ListResult {
  entities: AssignmentEntity[];
  itemCount: number;
}
