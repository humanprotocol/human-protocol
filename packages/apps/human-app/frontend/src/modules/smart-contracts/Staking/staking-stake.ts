import { Contract } from 'ethers';
import type { ContractCallArguments } from '@/modules/smart-contracts/types';
import Staking from '@/modules/smart-contracts/abi/Staking.json';
import { JsonRpcError } from '@/modules/smart-contracts/json-rpc-error';

export async function stakingStake({
  contractAddress,
  amount,
  signer,
}: {
  address: string;
  amount: string;
} & ContractCallArguments) {
  try {
    const stakingContract = new Contract(contractAddress, Staking.abi, signer);
    const tx = await stakingContract.stake(amount);
    await tx.wait();
  } catch (error) {
    throw new JsonRpcError(error);
  }
}
