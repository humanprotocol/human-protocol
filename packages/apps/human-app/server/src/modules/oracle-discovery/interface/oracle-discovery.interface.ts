import { ChainId, IOperator } from '@human-protocol/sdk/src';
import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class OracleDiscoveryDto {
  @AutoMap()
  @ApiProperty({ example: 80001 })
  chainId: ChainId;
  @AutoMap()
  @ApiProperty({ example: '0x1a23b23432cf23f09f3f' })
  @IsString()
  address: string;
  @AutoMap()
  @ApiProperty({ example: 'Exchange Oracle' })
  role: string;
}
export class OracleDiscoveryCommand {
  @AutoMap()
  chainId: ChainId;
  @AutoMap()
  address: string;
  @AutoMap()
  role: string;
}

export class OracleDiscoveryData implements IOperator {
  address: string;
  role?: string;
  constructor(address: string, role: string) {
    this.address = address;
    this.role = role;
  }
}
