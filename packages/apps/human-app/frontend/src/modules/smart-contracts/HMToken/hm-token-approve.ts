import { Contract } from 'ethers';
import HMToken from '@/modules/smart-contracts/abi/HMToken.json';
import type { ContractCallArguments } from '@/modules/smart-contracts/types';
import { JsonRpcError } from '@/modules/smart-contracts/json-rpc-error';

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
    const tx = await hmTokenContract.approve(spender, amount);
    await tx.wait();
  } catch (error) {
    throw new JsonRpcError(error);
  }
}
