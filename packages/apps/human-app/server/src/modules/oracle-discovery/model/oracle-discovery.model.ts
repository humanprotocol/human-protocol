import { IOperator } from '@human-protocol/sdk';
import { AutoMap } from '@automapper/classes';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class OracleDiscoveryDto {
  @AutoMap()
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @ApiPropertyOptional({ example: 80002 })
  chainId: number;
  @AutoMap()
  @ApiProperty({ example: '0x4708354213453af0cdC33eb75d94fBC00045841E' })
  address: string;
  constructor(chainId: number, address: string) {
    this.chainId = chainId;
    this.address = address;
  }
}
export class OracleDiscoveryCommand {
  @AutoMap()
  chainId: number;
  @AutoMap()
  address: string;
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
