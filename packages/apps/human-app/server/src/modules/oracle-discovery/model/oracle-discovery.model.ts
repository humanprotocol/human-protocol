import { IOperator } from '@human-protocol/sdk';
import { AutoMap } from '@automapper/classes';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';
import { Exclude, Transform } from 'class-transformer';

export class OracleDiscoveryResult implements IOperator {
  @ApiProperty({ description: 'Address of the oracle operator' })
  address: string;

  @ApiProperty({ description: 'Chain ID where the oracle is registered' })
  chainId: string;

  @ApiPropertyOptional({ description: 'Role of the oracle operator' })
  role?: string;

  @ApiPropertyOptional({ description: 'URL of the oracle operator' })
  url?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Types of jobs the oracle supports',
  })
  jobTypes?: string[];

  @ApiPropertyOptional({ description: 'Indicates if registration is needed' })
  registrationNeeded?: boolean;

  @ApiPropertyOptional({
    description: 'Instructions for registration, if needed',
  })
  registrationInstructions?: string;

  @Exclude()
  retriesCount = 0;

  @Exclude()
  executionsToSkip = 0;

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
