import { useSelector } from 'react-redux';
import { ChainId, SUPPORTED_CHAIN_IDS } from 'src/constants';
import { useSlowRefreshEffect } from 'src/hooks/useRefreshEffect';
import { AppState, useAppDispatch } from 'src/state';

import { fetchLeadersAsync } from './reducer';
import { LeaderData } from './types';

export const useLeadersData = () => {
  const dispatch = useAppDispatch();

  useSlowRefreshEffect(() => {
    dispatch(fetchLeadersAsync());
  }, [dispatch]);
};

export const useChainId = () => {
  const escrow = useSelector((state: AppState) => state.escrow);
  return escrow.chainId;
};

export const useLeadersByChainID = (): LeaderData[] => {
  const { leader } = useSelector((state: AppState) => state);
  const { leaders, chainId } = leader;

  console.log(leaders, chainId);

  if (chainId === ChainId.ALL) {
    const allLeaders: LeaderData[] = [];

    SUPPORTED_CHAIN_IDS.forEach((chainId) => {
      allLeaders.push(...(leaders[chainId] || []));
    });

    return allLeaders;
  }

  return leaders[chainId] || [];
};
