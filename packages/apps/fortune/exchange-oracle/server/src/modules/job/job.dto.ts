import { ChainId } from '@human-protocol/sdk';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { IsValidEthereumAddress } from '../../common/validators';
import {
  JobFieldName,
  JobSortField,
  JobStatus,
  JobType,
} from '../../common/enums/job';
import { PageOptionsDto } from '../../common/pagination/pagination.dto';

export class ManifestDto {
  requesterTitle: string;
  requesterDescription: string;
  submissionsRequired: number;
  fundAmount: number;
}

export class SolveJobDto {
  @ApiProperty({ name: 'escrow_address' })
  @IsString()
  @IsValidEthereumAddress()
  public escrowAddress: string;

  @ApiProperty({
    enum: ChainId,
    name: 'chain_id',
  })
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty()
  @IsString()
  public solution: string;
}

export class ResignJobDto {
  @ApiProperty({ name: 'assignment_id' })
  @IsNumber()
  public assignmentId: number;
}

export class GetJobsDto extends PageOptionsDto {
  @ApiPropertyOptional({
    name: 'sort_field',
    enum: JobSortField,
    default: JobSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(JobSortField)
  sortField?: JobSortField = JobSortField.CREATED_AT;

  @ApiPropertyOptional({ name: 'chain_id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  chainId: number;

  @ApiPropertyOptional({ name: 'job_type', enum: JobType })
  @IsEnum(JobType)
  @IsOptional()
  jobType: JobType;

  @ApiPropertyOptional({ enum: JobFieldName, isArray: true })
  @IsOptional()
  @IsEnum(JobFieldName, { each: true })
  fields: JobFieldName[];

  @ApiPropertyOptional({ name: 'escrow_address' })
  @IsOptional()
  @IsString()
  escrowAddress: string;

  @ApiPropertyOptional({ enum: JobStatus })
  @IsEnum(JobStatus)
  @IsOptional()
  status: JobStatus;
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
  rewardAmount?: number;

  @ApiProperty({ name: 'reward_token' })
  rewardToken?: string;

  @ApiProperty({ name: 'created_at' })
  createdAt?: string;

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
