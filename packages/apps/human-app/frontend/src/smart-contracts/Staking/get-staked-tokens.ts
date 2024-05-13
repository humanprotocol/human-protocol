import { Contract } from 'ethers';
import Staking from '@/smart-contracts/abi/Staking.json';
import type { ContractCallArguments } from '@/smart-contracts/types';

export async function getStakedTokens({
  contractAddress,
  stakerAddress,
  signer,
}: {
  stakerAddress: string;
} & ContractCallArguments) {
  const stakingContract = new Contract(contractAddress, Staking.abi, signer);
  return (await stakingContract.getFunction('getStakedTokens')(
    stakerAddress
  )) as Promise<bigint>;
}
