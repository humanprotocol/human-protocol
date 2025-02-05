import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { stakingStake } from '@/modules/smart-contracts/Staking/staking-stake';
import { useConnectedWallet } from '@/shared/contexts/wallet-connect';
import { getContractAddress } from '@/modules/smart-contracts/get-contract-address';
import { hmTokenApprove } from '@/modules/smart-contracts/HMToken/hm-token-approve';
import type { ContractCallArguments } from '@/modules/smart-contracts/types';
import { routerPaths } from '@/router/router-paths';
import { hmTokenAllowance } from '@/modules/smart-contracts/HMToken/hm-token-allowance';
import { useHMTokenDecimals } from '@/modules/operator/hooks/use-human-token-decimals';

type AmountValidation = z.ZodEffects<
  z.ZodEffects<z.ZodString, string, string>,
  string,
  string
>;
type AmountField = z.infer<AmountValidation>;

export const addStakeAmountCallArgumentsSchema = (
  decimals: number
): AmountValidation =>
  z
    .string()
    .refine((amount) => !amount.startsWith('-'))
    .refine(
      (amount) => {
        const decimalPart = amount.toString().split('.')[1];
        if (!decimalPart) return true;
        return decimalPart.length <= decimals;
      },
      {
        message: t('operator.stakeForm.invalidDecimals', {
          decimals,
        }),
      }
    );

export interface AddStakeCallArguments {
  amount: AmountField;
}

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

export function useAddStakeMutation() {
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
