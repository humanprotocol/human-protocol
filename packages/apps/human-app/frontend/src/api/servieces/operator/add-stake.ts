import { z } from 'zod';
import last from 'lodash/last';
import type { MutationState } from '@tanstack/react-query';
import {
  useMutation,
  useMutationState,
  useQueryClient,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { stake } from '@/smart-contracts/Staking/stake';
import type { ResponseError } from '@/shared/types/global.type';
import { useConnectedWallet } from '@/auth-web3/use-connected-wallet';
import { getContractAddress } from '@/smart-contracts/get-contract-address';
import { approve } from '@/smart-contracts/HMToken/approve';
import type { ContractCallArguments } from '@/smart-contracts/types';

const HMT_DECIMALS = 18;

export const addStakeCallArgumentsSchema = z.object({
  amount: z
    .string()
    .refine((amount) => !amount.startsWith('-'))
    .refine(
      (amount) => {
        const decimalPart = amount.toString().split('.')[1];
        if (!decimalPart) return true;
        return decimalPart.length <= HMT_DECIMALS;
      },
      {
        message: t('operator.stakeForm.invalidDecimals', {
          decimals: HMT_DECIMALS,
        }),
      }
    ),
});

export type AddStakeCallArguments = z.infer<typeof addStakeCallArgumentsSchema>;

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

  await approve({
    spender: stakingContractAddress,
    contractAddress: hmTokenContractAddress,
    chainId: data.chainId,
    provider: data.provider,
    signer: data.signer,
    amount: data.amount,
  });
  await stake({ ...data, contractAddress: stakingContractAddress });
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
