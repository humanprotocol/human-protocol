import { Contract } from 'ethers';
import HMToken from '@/smart-contracts/abi/HMToken.json';
import type { ContractCallArguments } from '@/smart-contracts/types';
import { JsonRpcError } from '@/smart-contracts/json-rpc-error';

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
