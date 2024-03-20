import { ChainId } from '@human-protocol/sdk';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { IsValidEthereumAddress } from '../../common/validators';
import { JobFieldName, JobSortField, JobStatus } from '../../common/enums/job';
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

export class GetJobsDto extends PageOptionsDto {
  @ApiPropertyOptional({ name: 'chain_id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  chainId: number;

  @ApiPropertyOptional({ name: 'job_type' })
  @IsOptional()
  @IsString()
  jobType: string;

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

  @ApiPropertyOptional({
    name: 'sort_field',
    enum: JobSortField,
    default: JobSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(JobSortField)
  sortField?: JobSortField = JobSortField.CREATED_AT;
}

export class JobDto {
  escrowAddress: string;
  chainId: number;
  jobType: string;
  status: JobStatus;
  jobDescription?: string;
  rewardAmount?: number;
  rewardToken?: string;
  createdAt?: number;

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
