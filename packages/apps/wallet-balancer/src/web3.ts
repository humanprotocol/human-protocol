import { Wallet, ethers } from 'ethers';
import { ConfigService } from './config';
import { NetworkDto, networks } from './networks';
import { ChainId } from '@human-protocol/sdk';
import { Web3Error } from './errors';

export enum TokenId {
  HMT = 'hmt',
  USDT = 'usdt',
  NATIVE = 'native',
}

export enum Web3Env {
  TESTNET = 'testnet',
  MAINNET = 'mainnet',
  LOCALHOST = 'localhost',
}

export const LOCALHOST_CHAIN_IDS = [ChainId.LOCALHOST];

export const TESTNET_CHAIN_IDS = [ChainId.POLYGON_AMOY];
export const MAINNET_CHAIN_IDS = [ChainId.POLYGON];

/**
 * Service for interacting with Web3.
 */
export class Web3Service {
  private signers: { [key: number]: Wallet } = {};
  public readonly signerAddress: string;

  /**
   * Constructs a new Web3Service instance.
   * @param configService The configuration service instance.
   */
  constructor(public readonly configService: ConfigService) {
    const privateKey = this.configService.web3PrivateKey;
    const validChains = this.getValidChains();
    const validNetworks = networks.filter((network) =>
      validChains.includes(network.chainId),
    );
    for (const network of validNetworks) {
      const provider = new ethers.JsonRpcProvider(network.rpcUrl);
      this.signers[network.chainId] = new Wallet(privateKey, provider);
    }
    this.signerAddress = this.signers[validChains[0]].address;
  }

  /**
   * Retrieves the signer for the specified chain ID.
   * @param chainId The chain ID.
   * @returns The signer wallet.
   */
  public getSigner(chainId: number): Wallet {
    this.validateChainId(chainId);
    return this.signers[chainId];
  }

  /**
   * Retrieves network information for the specified chain ID.
   * @param chainId The chain ID.
   * @returns The network information.
   * @throws Error if the network is not found.
   */
  public getNetwork(chainId: number): NetworkDto {
    const network = Object.values(networks).find(
      (item) => item.chainId === chainId,
    );

    if (!network) {
      throw new Error(Web3Error.NETWORK_NOT_FOUND);
    }

    return network;
  }

  /**
   * Validates the specified chain ID.
   * @param chainId The chain ID to validate.
   * @throws Error if the chain ID is invalid.
   */
  public validateChainId(chainId: number): void {
    const validChainIds = this.getValidChains();

    if (!validChainIds.includes(chainId)) {
      throw new Error(Web3Error.INVALID_CHAIN_ID);
    }
  }

  /**
   * Retrieves the valid chain IDs based on the current Web3 environment.
   * @returns An array of valid chain IDs.
   */
  public getValidChains(): ChainId[] {
    switch (this.configService.web3Env) {
      case Web3Env.MAINNET:
        return MAINNET_CHAIN_IDS;
      case Web3Env.TESTNET:
        return TESTNET_CHAIN_IDS;
      case Web3Env.LOCALHOST:
      default:
        return LOCALHOST_CHAIN_IDS;
    }
  }

  /**
   * Calculates the gas price for the specified chain ID.
   * @param chainId The chain ID.
   * @returns The calculated gas price.
   * @throws Error if the gas price cannot be calculated.
   */
  public async calculateGasPrice(chainId: number): Promise<bigint> {
    const signer = this.getSigner(chainId);
    const multiplier = this.configService.web3GasPriceMultiplier;
    const gasPrice = (await signer.provider?.getFeeData())?.gasPrice;
    if (gasPrice) {
      return gasPrice * BigInt(multiplier);
    }
    throw new Error(Web3Error.GAS_PRICE_ERROR);
  }
}
