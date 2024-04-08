import { Injectable } from '@nestjs/common';
import { Wallet, ethers } from 'ethers';
import { networkMap } from '../../common/constants/networks';
import { Web3ConfigService } from '@/common/config/web3-config.service';

@Injectable()
export class Web3Service {
  private signers: { [key: number]: Wallet } = {};

  constructor(private web3ConfigService: Web3ConfigService) {
    const privateKey = this.web3ConfigService.privateKey;

    for (const networkKey of Object.keys(networkMap)) {
      const network = networkMap[networkKey];
      const provider = new ethers.JsonRpcProvider(network.rpcUrl);
      this.signers[network.chainId] = new Wallet(privateKey, provider);
    }
  }

  getSigner(chainId: number): Wallet {
    return this.signers[chainId];
  }
}
