import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

import { IJobApproveDto } from "../interfaces";

export class JobApproveDto implements IJobApproveDto {
  @ApiProperty()
  @IsString()
  public transactionHash: string;
}
