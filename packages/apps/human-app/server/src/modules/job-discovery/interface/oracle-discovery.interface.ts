import { ChainId, IOperator } from '@human-protocol/sdk';
export class OracleDiscoveryDto {
  chainId: ChainId;
  address: string;
  role: string;
}
export class OracleDiscoveryCommand {
  chainId: ChainId;
  address: string;
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
