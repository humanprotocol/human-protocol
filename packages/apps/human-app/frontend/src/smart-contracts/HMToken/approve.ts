import { Contract, ethers } from 'ethers';
import HMToken from '@/smart-contracts/abi/HMToken.json';
import type { ContractCallArguments } from '@/smart-contracts/types';

export async function approve({
  contractAddress,
  spender,
  amount,
  signer,
}: {
  spender: string;
  amount: string;
} & ContractCallArguments) {
  const hmTokenContract = new Contract(contractAddress, HMToken.abi, signer);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- untyped ethers
  const tx = await hmTokenContract.approve(
    spender,
    ethers.parseEther(amount).toString()
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access  -- untyped ethers
  await tx.wait();
}
