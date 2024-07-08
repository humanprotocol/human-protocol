import { z } from 'zod';
import last from 'lodash/last';
import type { MutationState } from '@tanstack/react-query';
import {
  useMutation,
  useMutationState,
  useQueryClient,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { stakingStake } from '@/smart-contracts/Staking/staking-stake';
import type { ResponseError } from '@/shared/types/global.type';
import { useConnectedWallet } from '@/auth-web3/use-connected-wallet';
import { getContractAddress } from '@/smart-contracts/get-contract-address';
import { hmTokenApprove } from '@/smart-contracts/HMToken/hm-token-approve';
import type { ContractCallArguments } from '@/smart-contracts/types';
import { routerPaths } from '@/router/router-paths';
import { hmTokenAllowance } from '@/smart-contracts/HMToken/hm-token-allowance';
import { useHMTokenDecimals } from '@/api/servieces/operator/human-token-decimals';

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
    chainId: data.chainId,
    contractName: 'Staking',
  });

  const hmTokenContractAddress = getContractAddress({
    chainId: data.chainId,
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

export function useAddStakeMutationState() {
  const { address } = useConnectedWallet();

  const state = useMutationState({
    filters: { mutationKey: ['addStake', address] },
    select: (mutation) => mutation.state,
  });

  return last(state) as
    | MutationState<unknown, ResponseError, AddStakeCallArguments>
    | undefined;
}
