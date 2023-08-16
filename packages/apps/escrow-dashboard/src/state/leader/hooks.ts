import { ChainId } from '@human-protocol/sdk';
import { useSelector } from 'react-redux';

import { AppState, useAppDispatch } from '..';
import {
  fetchLeaderAsync,
  fetchLeaderEscrowsAsync,
  fetchLeadersAsync,
} from './reducer';
import { LeaderData } from './types';
import { SUPPORTED_CHAIN_IDS } from 'src/constants';
import { useSlowRefreshEffect } from 'src/hooks/useRefreshEffect';

export const useLeadersData = () => {
  const dispatch = useAppDispatch();

  useSlowRefreshEffect(() => {
    dispatch(fetchLeadersAsync());
  }, [dispatch]);
};

export const useFetchLeaderData = (chainId?: string, address?: string) => {
  const dispatch = useAppDispatch();

  useSlowRefreshEffect(() => {
    if (chainId && address) {
      dispatch(fetchLeaderAsync({ chainId: +chainId as ChainId, address }));
      dispatch(
        fetchLeaderEscrowsAsync({ chainId: +chainId as ChainId, address })
      );
    }
  }, [dispatch, chainId, address]);
};

export const useLeadersByChainID = (): Array<
  LeaderData & {
    chainId: ChainId;
  }
> => {
  const { leader } = useSelector((state: AppState) => state);
  const { leaders, chainId } = leader;

  if (chainId === ChainId.ALL) {
    const allLeaders: LeaderData[] = [];

    SUPPORTED_CHAIN_IDS.forEach((chainId) => {
      allLeaders.push(
        ...(leaders[chainId] || []).map((leader) => ({ ...leader, chainId }))
      );
    });

    return allLeaders;
  }

  return leaders[chainId]?.map((leader) => ({ ...leader, chainId })) || [];
};

export const useLeaderByAddress = (
  chainId?: string,
  address?: string
): LeaderData | undefined => {
  const { leader } = useSelector((state: AppState) => state);

  if (!chainId || !address) {
    throw new Error('chainId and address are required');
  }

  return leader.leaders[+chainId as ChainId]?.find(
    (leader) => leader.address === address
  );
};
