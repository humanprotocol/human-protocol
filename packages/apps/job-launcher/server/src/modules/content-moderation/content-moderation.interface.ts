import { JobEntity } from '../job/job.entity';

export interface IContentModeratorService {
  moderateJob(jobEntity: JobEntity): Promise<void>;
}
