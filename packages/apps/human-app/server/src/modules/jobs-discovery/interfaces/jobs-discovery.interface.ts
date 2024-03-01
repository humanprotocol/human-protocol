import { ApiProperty } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';

export class JobsDiscoveryParamsDto {
  @AutoMap()
  @ApiProperty({ example: 'string' })
  escrow_address: string;

  @AutoMap()
  @ApiProperty({ example: 0 })
  chain_id: number;

  @AutoMap()
  @ApiProperty({ example: 5 })
  page_size: number;

  @AutoMap()
  @ApiProperty({ example: 0 })
  page: number;

  @AutoMap()
  @ApiProperty({ example: 'ASC' })
  sort: 'ASC' | 'DESC';

  @AutoMap()
  @ApiProperty({ example: 'created_at' })
  sort_field: 'chain_id' | 'job_type' | 'reward_amount' | 'created_at';

  @AutoMap()
  @ApiProperty({ example: 'some_job_type' })
  job_type: string;

  @AutoMap()
  @ApiProperty({ example: ['field1', 'field2'] })
  fields: string[];
}

export class JobsDiscoveryParamsCommand {
  @AutoMap()
  escrow_address: string;
  @AutoMap()
  chain_id: number;
  @AutoMap()
  page_size: number;
  @AutoMap()
  page: number;
  @AutoMap()
  sort: string;
  @AutoMap()
  sort_field: string;
  @AutoMap()
  job_type: string;
  @AutoMap()
  fields: string[];
}

export class JobsDiscoveryParamsData {
  @AutoMap()
  escrow_address: string;
  @AutoMap()
  chain_id: number;
  @AutoMap()
  page_size: number;
  @AutoMap()
  page: number;
  @AutoMap()
  sort: string;
  @AutoMap()
  sort_field: string;
  @AutoMap()
  job_type: string;
  @AutoMap()
  fields: string[];
}

export class JobsDiscoveryResponseItem {
  escrow_address: string;
  chain_id: number;
  job_type: string;
  job_title: string;
  job_description: string;
  reward_amount: string;
  reward_token: string;
  created_at: string;
}

export class JobsDiscoveryResponse {
  data: JobsDiscoveryResponseItem[];
}
