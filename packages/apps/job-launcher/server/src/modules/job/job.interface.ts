import { JobEntity } from './job.entity';

export interface ListResult {
  entities: JobEntity[];
  itemCount: number;
}
