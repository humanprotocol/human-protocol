import { Injectable } from '@nestjs/common';
import { ChainId, EscrowUtils } from '@human-protocol/sdk';

@Injectable()
export class EscrowUtilsGateway {
  async getExchangeOracleAddressByEscrowAddress(
    chainId: ChainId,
    address: string,
  ): Promise<string> {
    const escrowsData = await EscrowUtils.getEscrow(chainId, address);
    if (!escrowsData) {
      throw new Error('Escrow not found');
    }
    if (!escrowsData.exchangeOracle) {
      throw new Error('Escrow is missing exchange oracle address');
    }
    return escrowsData.exchangeOracle;
  }
}
