import { Contract } from 'ethers';
import HMToken from '@/smart-contracts/abi/HMToken.json';
import type { ContractCallArguments } from '@/smart-contracts/types';
import { JsonRpcError } from '@/smart-contracts/json-rpc-error';

export async function hmTokenApprove({
  contractAddress,
  spender,
  amount,
  signer,
}: {
  spender: string;
  amount: string;
} & ContractCallArguments) {
  try {
    const hmTokenContract = new Contract(contractAddress, HMToken.abi, signer);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- untyped ethers
    const tx = await hmTokenContract.approve(spender, amount);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access  -- untyped ethers
    await tx.wait();
  } catch (error) {
    throw new JsonRpcError(error);
  }
}
