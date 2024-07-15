import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import {
  JobDiscoveryFieldName,
  JobDiscoverySortField,
  JobStatus,
} from '../../../common/enums/global-common';
import {
  PageableData,
  PageableDto,
  PageableParams,
  PageableResponse,
} from '../../../common/utils/pageable.model';

export class JobsDiscoveryParamsDto extends PageableDto {
  @AutoMap()
  @IsString()
  @ApiProperty()
  oracle_address?: string;
  @AutoMap()
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  escrow_address?: string;
  @AutoMap()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional()
  chain_id?: number;
  @AutoMap()
  @IsOptional()
  @IsEnum(JobDiscoverySortField)
  @ApiPropertyOptional({ enum: JobDiscoverySortField })
  sort_field?: JobDiscoverySortField;
  @AutoMap()
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  job_type?: string;
  @AutoMap()
  @IsOptional()
  @IsEnum(JobDiscoveryFieldName, { each: true })
  @ApiPropertyOptional({ enum: JobDiscoveryFieldName, isArray: true })
  fields: JobDiscoveryFieldName[];
  @AutoMap()
  @ApiPropertyOptional({ enum: JobStatus })
  @IsEnum(JobStatus)
  @IsOptional()
  status: JobStatus;
}

export class JobsDiscoveryParams extends PageableParams {
  @AutoMap()
  escrowAddress?: string;
  @AutoMap()
  chainId?: number;
  @AutoMap()
  sortField?: JobDiscoverySortField;
  @AutoMap()
  jobType?: string;
  @AutoMap()
  fields: JobDiscoveryFieldName[];
  @AutoMap()
  status: JobStatus;
}
export class JobsDiscoveryParamsData extends PageableData {
  @AutoMap()
  escrow_address?: string;
  @AutoMap()
  chain_id?: number;
  @AutoMap()
  sort_field?: JobDiscoverySortField;
  @AutoMap()
  job_type?: string;
  @AutoMap()
  fields: JobDiscoveryFieldName[];
  @AutoMap()
  status: JobStatus;
}
export class JobsDiscoveryParamsCommand {
  @AutoMap()
  oracleAddress: string;
  @AutoMap()
  token: string;
  @AutoMap()
  data: JobsDiscoveryParams;
}

export class JobsDiscoveryResponseItem {
  escrow_address: string;
  chain_id: number;
  job_type: string;
  status: JobStatus;
}

export class JobsDiscoveryResponse extends PageableResponse {
  results: JobsDiscoveryResponseItem[];
}
