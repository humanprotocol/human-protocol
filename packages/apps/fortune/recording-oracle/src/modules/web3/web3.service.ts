import { Inject, Injectable } from "@nestjs/common";
import { Wallet, providers } from "ethers";
import { Web3ConfigType, web3ConfigKey } from "../../common/config";
import { networkMap } from "../../common/constants/networks";

@Injectable()
export class Web3Service {
  private signers: { [key: number]: Wallet } = {};

  constructor(
    @Inject(web3ConfigKey)
    private web3Config: Web3ConfigType,
  ) {
    const privateKey = this.web3Config.web3PrivateKey;

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
