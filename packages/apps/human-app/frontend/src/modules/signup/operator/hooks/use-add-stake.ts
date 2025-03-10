import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { stakingStake } from '@/modules/smart-contracts/Staking/staking-stake';
import { useConnectedWallet } from '@/shared/contexts/wallet-connect';
import { getContractAddress } from '@/modules/smart-contracts/get-contract-address';
import { hmTokenApprove } from '@/modules/smart-contracts/HMToken/hm-token-approve';
import type { ContractCallArguments } from '@/modules/smart-contracts/types';
import { routerPaths } from '@/router/router-paths';
import { hmTokenAllowance } from '@/modules/smart-contracts/HMToken/hm-token-allowance';
import { type AddStakeCallArguments } from '../schema';
import { useHMTokenDecimals } from './use-human-token-decimals';

async function addStakeMutationFn(
  data: AddStakeCallArguments & {
    address: string;
    amount: string;
    decimals?: number;
  } & Omit<ContractCallArguments, 'contractAddress'>
) {
  const stakingContractAddress = getContractAddress({
    contractName: 'Staking',
  });

  const hmTokenContractAddress = getContractAddress({
    contractName: 'HMToken',
  });

  const allowance = await hmTokenAllowance({
    spender: stakingContractAddress,
    owner: data.address || '',
    contractAddress: hmTokenContractAddress,
    provider: data.provider,
    signer: data.signer,
    chainId: data.chainId,
  });

  const amountBigInt = ethers.parseUnits(data.amount, data.decimals);
  if (amountBigInt - allowance > 0) {
    await hmTokenApprove({
      spender: stakingContractAddress,
      contractAddress: hmTokenContractAddress,
      amount: amountBigInt.toString(),
      provider: data.provider,
      signer: data.signer,
      chainId: data.chainId,
    });
  }
  await stakingStake({
    ...data,
    amount: amountBigInt.toString(),
    contractAddress: stakingContractAddress,
  });
  return data;
}

export function useAddStake() {
  const {
    chainId,
    address,
    web3ProviderMutation: { data: web3data },
  } = useConnectedWallet();
  const { data: HMTDecimals } = useHMTokenDecimals();

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: AddStakeCallArguments) =>
      addStakeMutationFn({
        ...data,
        address,
        provider: web3data?.provider,
        signer: web3data?.signer,
        chainId,
        decimals: HMTDecimals,
      }),
    onSuccess: async () => {
      navigate(routerPaths.operator.addKeys);
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
    mutationKey: ['addStake', address],
  });
}
