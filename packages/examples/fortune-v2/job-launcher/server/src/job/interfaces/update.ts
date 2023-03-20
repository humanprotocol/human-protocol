import { IJobCommonDto } from "../../common/dto/job-common";
import { JobStatus } from "../../common/enums/job";

export interface IJobUpdateDto extends IJobCommonDto {
  status?: JobStatus;
  retriesCount?: number;
  waitUntil?: Date;
}
