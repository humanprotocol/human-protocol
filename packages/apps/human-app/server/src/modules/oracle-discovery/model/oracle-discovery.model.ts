import { IOperator } from '@human-protocol/sdk';
import { AutoMap } from '@automapper/classes';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class OracleDiscoveryResponse implements IOperator {
  address: string;
  role?: string;
  url?: string;
  jobTypes?: string[];
  constructor(address: string, role: string, url: string, jobTypes: string[]) {
    this.address = address;
    this.role = role;
    this.url = url;
    this.jobTypes = jobTypes;
  }
}
export class OracleDiscoveryDto {
  @ApiPropertyOptional({ type: [String], isArray: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : Array(value)))
  selected_job_types?: string[];
}
export class OracleDiscoveryCommand {
  @AutoMap()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  selectedJobTypes?: string[];
}
