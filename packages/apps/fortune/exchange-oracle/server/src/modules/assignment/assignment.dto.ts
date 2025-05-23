import { ChainId } from '@human-protocol/sdk';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsDate,
  IsEthereumAddress,
} from 'class-validator';
import {
  AssignmentSortField,
  AssignmentStatus,
  JobType,
} from '../../common/enums/job';
import { PageOptionsDto } from '../../common/pagination/pagination.dto';
import { IsEnumCaseInsensitive } from '../../common/decorators';

export class CreateAssignmentDto {
  @ApiProperty({
    enum: ChainId,
    name: 'chain_id',
    required: false,
  })
  @IsEnumCaseInsensitive(ChainId)
  chainId: ChainId;

  @ApiProperty({ name: 'escrow_address' })
  @IsEthereumAddress()
  escrowAddress: string;
}

export class GetAssignmentsDto extends PageOptionsDto {
  @ApiPropertyOptional({
    name: 'sort_field',
    enum: AssignmentSortField,
    default: AssignmentSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnumCaseInsensitive(AssignmentSortField)
  sortField?: AssignmentSortField = AssignmentSortField.CREATED_AT;

  @ApiPropertyOptional({ name: 'chain_id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  chainId?: number;

  @ApiPropertyOptional({ name: 'job_type', enum: JobType })
  @IsEnumCaseInsensitive(JobType)
  @IsOptional()
  jobType?: JobType;

  @ApiPropertyOptional({ name: 'escrow_address' })
  @IsOptional()
  @IsEthereumAddress()
  escrowAddress?: string;

  @ApiPropertyOptional({ enum: AssignmentStatus })
  @IsEnumCaseInsensitive(AssignmentStatus)
  @IsOptional()
  status?: AssignmentStatus;

  @ApiPropertyOptional({ name: 'assignment_id' })
  @IsOptional()
  @IsString()
  assignmentId?: string;

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

export class AssignmentDto {
  @ApiProperty({ name: 'assignment_id' })
  assignmentId: string;

  @ApiProperty({ name: 'escrow_address' })
  escrowAddress: string;

  @ApiProperty({ name: 'chain_id' })
  chainId: number;

  @ApiProperty({ name: 'job_type' })
  jobType: string;

  @ApiProperty()
  status: AssignmentStatus;

  @ApiPropertyOptional()
  url?: string;

  @ApiProperty({ name: 'reward_amount' })
  rewardAmount: number;

  @ApiProperty({ name: 'reward_token' })
  rewardToken: string;

  @ApiProperty({ name: 'created_at' })
  createdAt: string;

  @ApiPropertyOptional({ name: 'updated_at' })
  updatedAt?: string;

  @ApiProperty({ name: 'expires_at' })
  expiresAt: string;

  constructor(
    assignmentId: string,
    escrowAddress: string,
    chainId: number,
    jobType: string,
    status: AssignmentStatus,
    rewardAmount: number,
    rewardToken: string,
    createdAt: string,
    expiresAt: string,
    updatedAt: string,
  ) {
    this.assignmentId = assignmentId;
    this.escrowAddress = escrowAddress;
    this.chainId = chainId;
    this.jobType = jobType;
    this.status = status;
    this.rewardAmount = rewardAmount;
    this.rewardToken = rewardToken;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
    this.updatedAt = updatedAt;
  }
}

export class ResignDto {
  @ApiProperty({ name: 'assignment_id' })
  @IsString()
  public assignmentId: string;
}

export class AssignJobResponseDto {
  @ApiProperty({ name: 'assignment_id' })
  assignmentId: string;

  @ApiProperty({ name: 'escrow_address' })
  escrowAddress: string;

  @ApiProperty({ name: 'chain_id' })
  chainId: ChainId;

  @ApiProperty({ name: 'worker_address' })
  workerAddress: string;

  @ApiProperty({ name: 'reward_token' })
  rewardToken: string;
}
