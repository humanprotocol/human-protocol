import { Contract } from 'ethers';
import HMToken from '@/modules/smart-contracts/abi/HMToken.json';
import type { ContractCallArguments } from '@/modules/smart-contracts/types';
import { JsonRpcError } from '@/modules/smart-contracts/json-rpc-error';

export async function hmTokenDecimals({
  contractAddress,
  signer,
}: ContractCallArguments) {
  try {
    const hmTokenContract = new Contract(contractAddress, HMToken.abi, signer);
    const decimalsResult = (await hmTokenContract.getFunction(
      'decimals'
    )()) as Promise<bigint>;

    return Number(decimalsResult);
  } catch (error) {
    throw new JsonRpcError(error);
  }
}
