import { Injectable } from '@nestjs/common';
import { Wallet, ethers } from 'ethers';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { NetworkConfigService } from '../../common/config/network-config.service';

@Injectable()
export class Web3Service {
  private signers: { [key: number]: Wallet } = {};

  constructor(
    private web3ConfigService: Web3ConfigService,
    private networkConfigService: NetworkConfigService,
  ) {
    const privateKey = this.web3ConfigService.privateKey;

    for (const network of networkConfigService.networks) {
      const provider = new ethers.JsonRpcProvider(network.rpcUrl);
      this.signers[network.chainId] = new Wallet(privateKey, provider);
    }
  }

  getSigner(chainId: number): Wallet {
    return this.signers[chainId];
  }
}
