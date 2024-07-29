import { Contract } from 'ethers';
import Staking from '@/smart-contracts/abi/Staking.json';
import type { ContractCallArguments } from '@/smart-contracts/types';
import { JsonRpcError } from '@/smart-contracts/json-rpc-error';

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- untyped ethers
    const tx = await stakingContract.stake(amount);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- untyped ethers
    await tx.wait();
  } catch (error) {
    throw new JsonRpcError(error);
  }
}
