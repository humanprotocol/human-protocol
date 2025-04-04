import { Contract } from 'ethers';
import HMToken from '@/modules/smart-contracts/abi/HMToken.json';
import type { ContractCallArguments } from '@/modules/smart-contracts/types';
import { JsonRpcError } from '@/modules/smart-contracts/json-rpc-error';

export async function hmTokenAllowance({
  spender,
  owner,
  contractAddress,
  signer,
}: { spender: string; owner: string } & ContractCallArguments) {
  try {
    const hmTokenContract = new Contract(contractAddress, HMToken.abi, signer);
    const allowanceResult = (await hmTokenContract.getFunction('allowance')(
      owner,
      spender
    )) as Promise<bigint>;

    return allowanceResult;
  } catch (error) {
    throw new JsonRpcError(error);
  }
}
