import { Contract, ethers } from 'ethers';
import Staking from '@/smart-contracts/abi/Staking.json';
import type { ContractCallArguments } from '@/smart-contracts/types';

export async function stake({
  contractAddress,
  amount,
  signer,
}: {
  address: string;
  amount: string;
} & ContractCallArguments) {
  const stakingContract = new Contract(contractAddress, Staking.abi, signer);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- untyped ethers
  const tx = await stakingContract.stake(ethers.parseEther(amount).toString());
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- untyped ethers
  await tx.wait();
}
