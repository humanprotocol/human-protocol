import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";
import { IJobLaunchDto } from "../interfaces";

export class JobLaunchDto implements IJobLaunchDto {
  @ApiProperty()
  @IsNumber()
  public jobId: number

  @ApiProperty()
  @IsString()
  public paymentId: string
}
