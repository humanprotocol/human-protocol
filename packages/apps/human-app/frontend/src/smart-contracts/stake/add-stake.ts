// TODO replace by smart contract instance created with ethers.js
import { ethers } from 'ethers';
import type { BrowserProvider, JsonRpcSigner } from 'ethers';
import { chains } from '@/smart-contracts/chains';
import { FakeSmartContract } from '@/smart-contracts/stake/fake-stake-smart-contract';
import StakingAbi from '@/smart-contracts/abi/Staking.json';

export async function addStake({
  address,
  amount,
  provider,
  signer,
  chainId,
}: {
  address: string;
  amount: number;
  chainId: number;
  provider?: BrowserProvider;
  signer?: JsonRpcSigner;
}) {
  const stakeContractAddress = chains.find(
    ({ chainId: _chainId }) => _chainId === chainId
  )?.addresses.Staking;

  if (!stakeContractAddress) {
    throw new Error(`Cannot find contract address.`);
  }

  const nonce = await provider?.getTransactionCount(address, 'latest');
  const gasLimit = 250000;
  const iface = new ethers.Interface(StakingAbi.abi);
  const data = iface.encodeFunctionData('stake', [amount]);

  const result = await signer?.sendTransaction({
    nonce,
    gasLimit,
    to: stakeContractAddress,
    value: amount,
    data,
    chainId,
  });
  await result?.wait();
  return FakeSmartContract.getInstance().setStack(amount);
}
