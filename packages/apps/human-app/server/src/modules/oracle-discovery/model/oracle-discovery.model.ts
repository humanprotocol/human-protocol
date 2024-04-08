import { ChainId, IOperator } from '@human-protocol/sdk';
import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { optional } from 'joi';

export class OracleDiscoveryDto {
  @AutoMap()
  @ApiProperty({ example: 80001, required: false })
  chainId: ChainId;
  @AutoMap()
  @ApiProperty({ example: '0x1a23b23432cf23f09f3f' })
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
  constructor(address: string, role: string) {
    this.address = address;
    this.role = role;
  }
}
