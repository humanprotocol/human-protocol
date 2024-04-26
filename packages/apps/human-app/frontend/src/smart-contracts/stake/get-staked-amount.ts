import type { JsonRpcSigner } from 'ethers';
import { Contract } from 'ethers';
import StakingAbi from '@/smart-contracts/abi/Staking.json';
import { chains } from '@/smart-contracts/chains';

export async function getStackedAmount({
  stakerAddress,
  chainId,
  signer,
}: {
  stakerAddress: string;
  chainId: number;
  signer?: JsonRpcSigner;
}) {
  const contractAddress = chains.find(
    ({ chainId: _chainId }) => _chainId === chainId
  )?.addresses.Staking;

  if (!contractAddress) {
    throw new Error(`Cannot find contract address.`);
  }

  const stakingContract = new Contract(contractAddress, StakingAbi.abi, signer);
  return (await stakingContract.getFunction('getStakedTokens')(
    stakerAddress
  )) as Promise<bigint>;
}
