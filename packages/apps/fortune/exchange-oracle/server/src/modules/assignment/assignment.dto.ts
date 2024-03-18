import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import {
  AssignmentStatus,
  AssignmentSortField,
  JobSortField,
  JobStatus,
} from '../../common/enums/job';
import { PageOptionsDto } from '../../common/pagination/pagination.dto';

export class CreateAssignmentDto {
  @ApiProperty({ name: 'chain_id' })
  @Type(() => Number)
  @IsNumber()
  chainId: number;

  @ApiProperty({ name: 'escrow_address' })
  @IsString()
  escrowAddress: string;
}

export class GetAssignmentsDto extends PageOptionsDto {
  @ApiPropertyOptional({ name: 'chain_id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  chainId: number;

  @ApiPropertyOptional({ name: 'job_type' })
  @IsOptional()
  @IsString()
  jobType: string;

  @ApiPropertyOptional({ name: 'escrow_address' })
  @IsOptional()
  @IsString()
  escrowAddress: string;

  @ApiPropertyOptional({ enum: AssignmentStatus })
  @IsEnum(AssignmentStatus)
  @IsOptional()
  status: AssignmentStatus;

  @ApiPropertyOptional({
    name: 'sort_field',
    enum: JobSortField,
    default: JobSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(AssignmentSortField)
  sortField?: AssignmentSortField = AssignmentSortField.CREATED_AT;
}

export class AssignmentDto {
  assginmentId: number;
  escrowAddress: string;
  chainId: number;
  jobType: string;
  status: JobStatus;
  url?: string;
  rewardAmount: number;
  rewardToken: string;
  createdAt: number;
  updatedAt?: number;
  expiresAt: number;

  constructor(
    assginmentId: number,
    escrowAddress: string,
    chainId: number,
    jobType: string,
    status: JobStatus,
    rewardAmount: number,
    rewardToken: string,
    createdAt: number,
    expiresAt: number,
  ) {
    this.assginmentId = assginmentId;
    this.escrowAddress = escrowAddress;
    this.chainId = chainId;
    this.jobType = jobType;
    this.status = status;
    this.rewardAmount = rewardAmount;
    this.rewardToken = rewardToken;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
  }
}
