import { IOperator } from '@human-protocol/sdk';
import { AutoMap } from '@automapper/classes';
import { ApiPropertyOptional } from '@nestjs/swagger';

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
  @AutoMap()
  @ApiPropertyOptional()
  selected_job_types?: string[];
}
export class OracleDiscoveryCommand {
  @AutoMap()
  selectedJobTypes?: string[];
}
