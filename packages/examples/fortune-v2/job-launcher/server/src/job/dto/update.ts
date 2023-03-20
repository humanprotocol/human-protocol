import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum } from "class-validator";

import { JobCommonDto } from "../../common/dto/job-common";
import { JobStatus } from "../../common/enums/job";
import { IJobUpdateDto } from "../interfaces";

export class UpdateJobDto extends JobCommonDto implements IJobUpdateDto {
  @ApiPropertyOptional({
    enum: JobStatus,
  })
  @IsEnum(JobStatus)
  public status: JobStatus;
}
