import { SortDirection } from '../../common/enums/collection';
import { JobSortField, JobStatus } from '../../common/enums/job';
import { JobEntity } from './job.entity';

export interface JobFilterData {
  chainId?: number;
  escrowAddress?: string;
  status?: JobStatus;
  sortField?: JobSortField;
  sort?: SortDirection;
  skip: number;
  pageSize: number;
  reputationNetwork: string;
}

export interface ListResult {
  entities: JobEntity[];
  itemCount: number;
}
