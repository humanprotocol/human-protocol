import { ChainId, IOperator } from '@human-protocol/sdk';
import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { optional } from 'joi';

export class OracleDiscoveryDto {
  @AutoMap()
  @ApiProperty({ example: 80002, required: false })
  chainId: ChainId;
  @AutoMap()
  @ApiProperty({ example: '0x4708354213453af0cdC33eb75d94fBC00045841E' })
  address: string;
  constructor(chainId: ChainId, address: string) {
    this.chainId = chainId;
    this.address = address;
  }
}
export class OracleDiscoveryCommand {
  @AutoMap()
  chainId: ChainId;
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
