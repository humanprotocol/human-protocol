import { Contract } from 'ethers';
import EthKVStore from '@/smart-contracts/abi/EthKVStore.json';
import type { ContractCallArguments } from '@/smart-contracts/types';
import type {
  SetBulkKeys,
  SetBulkValues,
} from '@/smart-contracts/EthKVStore/config';

export async function setBulk({
  keys,
  values,
  contractAddress,
  signer,
}: {
  keys: SetBulkKeys;
  values: SetBulkValues;
} & ContractCallArguments) {
  const ethKVStoreContract = new Contract(
    contractAddress,
    EthKVStore.abi,
    signer
  );

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- untyped ethers
  const tx = await ethKVStoreContract.setBulk(keys, values);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access  -- untyped ethers
  await tx.wait();
}
