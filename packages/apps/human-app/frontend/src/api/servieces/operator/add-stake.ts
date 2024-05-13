import { z } from 'zod';
import last from 'lodash/last';
import type { MutationState } from '@tanstack/react-query';
import {
  useMutation,
  useMutationState,
  useQueryClient,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { stakingStake } from '@/smart-contracts/Staking/staking-stake';
import type { ResponseError } from '@/shared/types/global.type';
import { useConnectedWallet } from '@/auth-web3/use-connected-wallet';
import { getContractAddress } from '@/smart-contracts/get-contract-address';
import { hmTokenApprove } from '@/smart-contracts/HMToken/hm-token-approve';
import type { ContractCallArguments } from '@/smart-contracts/types';

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

  await hmTokenApprove({
    spender: stakingContractAddress,
    contractAddress: hmTokenContractAddress,
    chainId: data.chainId,
    provider: data.provider,
    signer: data.signer,
    amount: data.amount,
  });
  await stakingStake({ ...data, contractAddress: stakingContractAddress });
  return data;
}

export const addStakeMutationKey = ['addStake'];

export function useAddStakeMutation() {
  const {
    chainId,
    address,
    web3ProviderMutation: { data: web3data },
  } = useConnectedWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddStakeCallArguments) =>
      addStakeMutationFn({
        ...data,
        address,
        provider: web3data?.provider,
        signer: web3data?.signer,
        chainId,
      }),
    onSuccess: async () => {
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
