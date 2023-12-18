import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BigNumberish, Wallet, providers } from 'ethers';
import { ConfigNames, networkMap } from '../../common/config';

@Injectable()
export class Web3Service {
  private signers: { [key: number]: Wallet } = {};

  constructor(private readonly configService: ConfigService) {
    const privateKey = this.configService.get(ConfigNames.WEB3_PRIVATE_KEY);
    for (const networkKey of Object.keys(networkMap)) {
      const network = networkMap[networkKey];
      const provider = new providers.JsonRpcProvider(network.rpcUrl);
      this.signers[network.chainId] = new Wallet(privateKey, provider);
    }
  }

  getSigner(chainId: number): Wallet {
    return this.signers[chainId];
  }

  public async calculateGasPrice(chainId: number): Promise<BigNumberish>{
    const signer = this.getSigner(chainId);
    const multiplier = this.configService.get<number>(ConfigNames.GAS_PRICE_MULTIPLIER);
    if (multiplier) {
      return (await signer.provider.getGasPrice()).mul(multiplier);
    }

    return 1;
  }
}
