import last from 'lodash/last';
import { useMutationState } from '@tanstack/react-query';
import type { MutationState } from '@tanstack/react-query';
import { useConnectedWallet } from '@/shared/contexts/wallet-connect';
import type { ResponseError } from '@/shared/types/global.type';
import { type AddStakeCallArguments } from '@/modules/operator/hooks/use-add-stake';

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
