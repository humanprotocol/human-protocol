import { IOperator } from '@human-protocol/sdk';
import { AutoMap } from '@automapper/classes';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class OracleDiscoveryResponse implements IOperator {
  address: string;
  chainId: string;
  role?: string;
  url?: string;
  jobTypes?: string[];
  registrationNeeded?: boolean;
  registrationInstructions?: string;
  retriesCount = 0;
  constructor(
    address: string,
    chainId: string,
    role?: string,
    url?: string,
    jobTypes?: string[],
    registrationNeeded?: boolean,
    registrationInstructions?: string,
  ) {
    this.address = address;
    this.chainId = chainId;
    this.role = role;
    this.url = url;
    this.jobTypes = jobTypes;
    this.registrationNeeded = registrationNeeded;
    this.registrationInstructions = registrationInstructions;
  }
}
export class OracleDiscoveryDto {
  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : Array(value)))
  selected_job_types?: string[];
}
export class OracleDiscoveryCommand {
  @AutoMap()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  selectedJobTypes?: string[];
}
