import {
  BINANCE_NETWORK,
  BINANCE_TESTNET_NETWORK,
  GOERLI_NETWORK,
  MUMBAI_NETWORK,
  POLYGON_NETWORK,
} from "nestjs-ethers";
import { Network } from "@ethersproject/providers";

export interface NetworkDto {
  network: Network;
  rpcUrl: string;
}

interface NetworkMapDto {
  [key: string]: NetworkDto;
}

export const networkMap: NetworkMapDto = {
  polygon: {
    network: POLYGON_NETWORK,
    rpcUrl: "https://polygon-mainnet.g.alchemy.com/v2/0Lorh5KRkGl5FsRwy2epTg8fEFFoqUfY"
  },
  bsc: {
    network: BINANCE_NETWORK,
    rpcUrl: "https://bsc-dataseed1.binance.org/"
  },
  mumbai: {
    network: MUMBAI_NETWORK,
    rpcUrl: "https://polygon-mumbai.g.alchemy.com/v2/vKNSJzJf6SW2sdW-05bgFwoyFxUrMzii"
  },
  goerli: {
    network: GOERLI_NETWORK,
    rpcUrl: "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
  },
  moonbeam: {
    network: BINANCE_NETWORK,
    rpcUrl: "https://rpc.api.moonbeam.network"
  },
  bsctest: {
    network: BINANCE_TESTNET_NETWORK,
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/"
  },
};

export const networks = Object.values(networkMap).map(network => network);