import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import {
  JobFieldName,
  JobSortField,
  JobStatus,
  JobType,
} from '../../common/enums/job';
import { PageOptionsDto } from '../../common/pagination/pagination.dto';
import { IsEnumCaseInsensitive } from '../../common/decorators';

export class ManifestDto {
  requesterTitle: string;
  requesterDescription: string;
  submissionsRequired: number;
  fundAmount: number;
  qualifications?: string[];
}

export class SolveJobDto {
  @ApiProperty()
  @IsString()
  public solution: string;

  @ApiProperty({ name: 'assignment_id' })
  @IsString()
  public assignmentId: string;
}

export class GetJobsDto extends PageOptionsDto {
  @ApiPropertyOptional({
    name: 'sort_field',
    enum: JobSortField,
    default: JobSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnumCaseInsensitive(JobSortField)
  sortField?: JobSortField = JobSortField.CREATED_AT;

  @ApiPropertyOptional({ name: 'chain_id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  chainId: number;

  @ApiPropertyOptional({ name: 'job_type', enum: JobType })
  @IsEnumCaseInsensitive(JobType)
  @IsOptional()
  jobType: JobType;

  @ApiPropertyOptional({ enum: JobFieldName, isArray: true })
  @IsOptional()
  @IsEnumCaseInsensitive(JobFieldName, { each: true })
  fields: JobFieldName[];

  @ApiPropertyOptional({ name: 'escrow_address' })
  @IsOptional()
  @IsString()
  escrowAddress: string;

  @ApiPropertyOptional({ enum: JobStatus })
  @IsEnumCaseInsensitive(JobStatus)
  @IsOptional()
  status: JobStatus;

  @ApiPropertyOptional({ name: 'created_after' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdAfter?: Date;

  @ApiPropertyOptional({ name: 'updated_after' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  updatedAfter?: Date;
}

export class JobDto {
  @ApiProperty({ name: 'escrow_address' })
  escrowAddress: string;

  @ApiProperty({ name: 'chain_id' })
  chainId: number;

  @ApiProperty({ name: 'job_type' })
  jobType: string;

  @ApiProperty()
  status: JobStatus;

  @ApiProperty({ name: 'job_description' })
  jobDescription?: string;

  @ApiProperty({ name: 'reward_amount' })
  rewardAmount?: string;

  @ApiProperty({ name: 'reward_token' })
  rewardToken?: string;

  @ApiProperty({ name: 'created_at' })
  createdAt?: string;

  @ApiProperty({ name: 'updated_at' })
  updatedAt?: string;

  @ApiProperty()
  qualifications?: string[];

  constructor(
    escrowAddress: string,
    chainId: number,
    jobType: string,
    status: JobStatus,
  ) {
    this.escrowAddress = escrowAddress;
    this.chainId = chainId;
    this.jobType = jobType;
    this.status = status;
  }
}

export class SolveJobResponseDto {
  @ApiProperty({ name: 'assignment_id' })
  assignmentId: string;

  @ApiProperty({ name: 'solution' })
  solution: string;

  @ApiProperty({ name: 'message' })
  message: string;
}
