import { Contract } from 'ethers';
import EthKVStore from '@/modules/smart-contracts/abi/EthKVStore.json';
import type { ContractCallArguments } from '@/modules/smart-contracts/types';
import type {
  SetKYCPayload,
  SetOperatorPayload,
} from '@/modules/smart-contracts/EthKVStore/config';
import { JsonRpcError } from '@/modules/smart-contracts/json-rpc-error';

export async function ethKvStoreSetBulk({
  keys,
  values,
  contractAddress,
  signer,
}: (SetOperatorPayload | SetKYCPayload) & ContractCallArguments) {
  try {
    const ethKVStoreContract = new Contract(
      contractAddress,
      EthKVStore.abi,
      signer
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- untyped ethers
    const tx = await ethKVStoreContract.setBulk(keys, values);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access  -- untyped ethers
    await tx.wait();
  } catch (error) {
    throw new JsonRpcError(error);
  }
}
