import { Injectable, NotFoundException } from '@nestjs/common';
import { ChainId, EscrowUtils } from '@human-protocol/sdk';

@Injectable()
export class EscrowUtilsGateway {
  async getExchangeOracleAddressByEscrowAddress(
    chainId: ChainId,
    address: string,
  ): Promise<string> {
    const escrowsData = await EscrowUtils.getEscrow(chainId, address);
    if (!escrowsData.exchangeOracle) {
      throw new NotFoundException('Exchange Oracle not found');
    }
    return escrowsData.exchangeOracle;
  }
}
