import { Contract, ethers } from 'ethers';
import EthKVStore from '@/modules/smart-contracts/abi/EthKVStore.json';
import type { ContractCallArguments } from '@/modules/smart-contracts/types';
import type { KYCKey } from '@/modules/smart-contracts/EthKVStore/config';
import { JsonRpcError } from '@/modules/smart-contracts/json-rpc-error';
import { env } from '@/shared/env';
import type { ChainWithAddresses } from '@/modules/smart-contracts/chains';
import { MainnetChains, TestnetChains } from '@/modules/smart-contracts/chains';

export async function ethKVStoreGetKycData({
  kycKey,
  accountAddress,
  contractAddress,
}: { kycKey: KYCKey; accountAddress: string } & Omit<
  ContractCallArguments,
  'chainId' | 'signer'
>) {
  try {
    let chain: ChainWithAddresses | undefined;

    if (env.VITE_NETWORK === 'mainnet') {
      chain = MainnetChains[0];
    } else {
      chain = TestnetChains[0];
    }

    const provider = new ethers.JsonRpcProvider(chain.rpcUrl);

    const ethKVStoreContract = new Contract(
      contractAddress,
      EthKVStore.abi,
      provider
    );

    const result = (await ethKVStoreContract.get(accountAddress, kycKey)) as
      | string
      | null;

    return result;
  } catch (error) {
    throw new JsonRpcError(error);
  }
}
