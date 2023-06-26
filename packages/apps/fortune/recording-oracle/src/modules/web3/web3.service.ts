import { Inject, Injectable } from "@nestjs/common";
import { Wallet, providers } from "ethers";

import { EthereumConfigType, ethereumConfigKey } from "@/common/config";
import { networkMap } from "@/common/constants";

@Injectable()
export class Web3Service {
  private signers: { [key: number]: Wallet } = {};

  constructor(
    @Inject(ethereumConfigKey)
    private ethereumConfig: EthereumConfigType,
  ) {
    const privateKey = this.ethereumConfig.privateKey;

    for (const networkKey of Object.keys(networkMap)) {
      const network = networkMap[networkKey];
      const provider = new providers.JsonRpcProvider(network.rpcUrl);
      this.signers[network.chainId] = new Wallet(privateKey, provider);
    }
  }

  getSigner(chainId: number): Wallet {
    return this.signers[chainId];
  }
}
