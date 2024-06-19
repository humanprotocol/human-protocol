import { Contract } from 'ethers';
import Staking from '@/smart-contracts/abi/Staking.json';
import type { ContractCallArguments } from '@/smart-contracts/types';
import { JsonRpcError } from '@/smart-contracts/json-rpc-error';

export async function stakingGetStakedTokens({
  contractAddress,
  stakerAddress,
  signer,
}: {
  stakerAddress: string;
} & ContractCallArguments) {
  try {
    const stakingContract = new Contract(contractAddress, Staking.abi, signer);
    return (await stakingContract.getFunction('getStakedTokens')(
      stakerAddress
    )) as Promise<bigint>;
  } catch (error) {
    throw new JsonRpcError(error);
  }
}
