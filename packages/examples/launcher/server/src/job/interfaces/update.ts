import { JobStatus } from "../../common/decorators";
import { IJobCommonDto } from "../../common/dto/job-common";

export interface IJobUpdateDto extends IJobCommonDto {
  status?: JobStatus;
}
