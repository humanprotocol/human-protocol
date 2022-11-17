import { useSelector } from 'react-redux';
import { SUPPORTED_CHAIN_IDS } from 'src/constants';
import { useSlowRefreshEffect } from 'src/hooks/useRefreshEffect';
import { AppState, useAppDispatch } from 'src/state';

import { fetchTokenStatsAsync } from './reducer';
import { TokenStats } from './types';

export const usePollTokenStats = () => {
  const dispatch = useAppDispatch();

  useSlowRefreshEffect(() => {
    dispatch(fetchTokenStatsAsync());
  }, [dispatch]);
};

export const useTokenStats = (): TokenStats => {
  const token = useSelector((state: AppState) => state.token);
  const { stats } = token;

  const tokenStats: TokenStats = {
    totalApprovalEventCount: 0,
    totalTransferEventCount: 0,
    totalValueTransfered: 0,
    holders: 0,
  };

  SUPPORTED_CHAIN_IDS.forEach((chainId) => {
    if (stats[chainId]) {
      tokenStats.totalApprovalEventCount += stats[
        chainId
      ]?.totalApprovalEventCount!;
      tokenStats.totalTransferEventCount += stats[
        chainId
      ]?.totalTransferEventCount!;
      tokenStats.totalValueTransfered += stats[chainId]?.totalValueTransfered!;
      tokenStats.holders += stats[chainId]?.holders!;
    }
  });

  return tokenStats;
};

export const useTokenStatsLoaded = () => {
  const token = useSelector((state: AppState) => state.token);

  return token.statsLoaded;
};
