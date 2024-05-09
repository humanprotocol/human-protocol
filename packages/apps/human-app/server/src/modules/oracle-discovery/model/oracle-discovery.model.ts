import { IOperator } from '@human-protocol/sdk';
import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class OracleDiscoveryDto {
  @AutoMap()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ example: 80002 })
  chainId: number;
}
export class OracleDiscoveryCommand {
  @AutoMap()
  chainId: number;
}

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
