import { Contract } from 'ethers';
import EthKVStore from '@/smart-contracts/abi/EthKVStore.json';
import type { ContractCallArguments } from '@/smart-contracts/types';
import type { KYCKey } from '@/smart-contracts/EthKVStore/config';
import { JsonRpcError } from '@/smart-contracts/json-rpc-error';

export async function ethKVStoreGetKycData({
  kycKey,
  accountAddress,
  contractAddress,
  signer,
}: { kycKey: KYCKey; accountAddress: string } & ContractCallArguments) {
  try {
    const ethKVStoreContract = new Contract(
      contractAddress,
      EthKVStore.abi,
      signer
    );
    const result = (await ethKVStoreContract.get(accountAddress, kycKey)) as
      | string
      | null;

    return result;
  } catch (error) {
    throw new JsonRpcError(error);
  }
}
