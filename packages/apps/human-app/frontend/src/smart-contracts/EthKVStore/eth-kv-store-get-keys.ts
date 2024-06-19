import { Contract } from 'ethers';
import EthKVStore from '@/smart-contracts/abi/EthKVStore.json';
import type { ContractCallArguments } from '@/smart-contracts/types';
import { EthKVStoreKeys } from '@/smart-contracts/EthKVStore/config';
import { JsonRpcError } from '@/smart-contracts/json-rpc-error';

export async function ethKVStoreGetKeys({
  accountAddress,
  contractAddress,
  signer,
}: { accountAddress: string } & ContractCallArguments) {
  try {
    const ethKVStoreContract = new Contract(
      contractAddress,
      EthKVStore.abi,
      signer
    );
    const keys = (await Promise.all([
      ethKVStoreContract.get(accountAddress, EthKVStoreKeys.PublicKey),
      ethKVStoreContract.get(accountAddress, EthKVStoreKeys.WebhookUrl),
      ethKVStoreContract.get(accountAddress, EthKVStoreKeys.Role),
      ethKVStoreContract.get(accountAddress, EthKVStoreKeys.JobTypes),
      ethKVStoreContract.get(accountAddress, EthKVStoreKeys.Fee),
    ])) as unknown as string[];

    return {
      [EthKVStoreKeys.PublicKey]: keys[0],
      [EthKVStoreKeys.WebhookUrl]: keys[1],
      [EthKVStoreKeys.Role]: keys[2],
      [EthKVStoreKeys.JobTypes]: keys[3],
      [EthKVStoreKeys.Fee]: keys[4],
    };
  } catch (error) {
    throw new JsonRpcError(error);
  }
}
