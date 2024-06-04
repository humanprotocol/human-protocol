import { Contract } from 'ethers';
import EthKVStore from '@/smart-contracts/abi/EthKVStore.json';
import type { ContractCallArguments } from '@/smart-contracts/types';
import type { KYCKey } from '@/smart-contracts/EthKVStore/config';
import type { RegisterAddressSuccess } from '@/api/servieces/worker/register-address';

export async function ethKVStoreGetKycData({
  kycKey,
  accountAddress,
  contractAddress,
  signer,
}: { kycKey: KYCKey; accountAddress: string } & RegisterAddressSuccess &
  ContractCallArguments) {
  const ethKVStoreContract = new Contract(
    contractAddress,
    EthKVStore.abi,
    signer
  );
  const result = (await ethKVStoreContract.get(accountAddress, kycKey)) as
    | string
    | null;

  return result;
}
