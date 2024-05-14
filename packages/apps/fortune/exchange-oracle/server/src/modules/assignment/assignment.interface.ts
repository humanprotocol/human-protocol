import { SortDirection } from '../../common/enums/collection';
import { AssignmentSortField, AssignmentStatus } from '../../common/enums/job';
import { AssignmentEntity } from './assignment.entity';

export interface AssignmentFilterData {
  chainId?: number;
  assignmentId?: string;
  escrowAddress?: string;
  status?: AssignmentStatus;
  sortField?: AssignmentSortField;
  sort?: SortDirection;
  skip: number;
  pageSize: number;
  workerAddress: string;
  reputationNetwork: string;
}

export interface ListResult {
  entities: AssignmentEntity[];
  itemCount: number;
}
