import { Contract } from 'ethers';
import HMToken from '@/smart-contracts/abi/HMToken.json';
import type { ContractCallArguments } from '@/smart-contracts/types';

export async function decimals({
  contractAddress,
  signer,
}: ContractCallArguments) {
  const stakingContract = new Contract(contractAddress, HMToken.abi, signer);
  const decimalsResult = (await stakingContract.getFunction(
    'decimals'
  )()) as Promise<bigint>;

  return Number(decimalsResult);
}
