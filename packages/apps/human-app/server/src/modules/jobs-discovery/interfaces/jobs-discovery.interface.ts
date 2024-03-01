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
  @ApiProperty({ example: 5, default: 5, maximum: 10 })
  page_size: number;

  @AutoMap()
  @ApiProperty({ example: 0, default: 0 })
  page: number;

  @AutoMap()
  @ApiProperty({ example: 'ASC', default: 'ASC' })
  sort: 'ASC' | 'DESC';

  @AutoMap()
  @ApiProperty({ example: 'created_at', default: 'created_at' })
  sort_field: 'chain_id' | 'job_type' | 'reward_amount' | 'created_at';

  @AutoMap()
  @ApiProperty({ example: 'job type' })
  job_type: string;

  @AutoMap()
  @ApiProperty({
    example: [
      'job_title',
      'job_description',
      'reward_amount',
      'reward_token',
      'created_at',
    ],
  })
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
