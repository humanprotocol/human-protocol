import BigNumber from 'bignumber.js';
import { useSelector } from 'react-redux';
import { SUPPORTED_CHAIN_IDS, TESTNET_CHAIN_IDS } from 'src/constants';
import { useSlowRefreshEffect } from 'src/hooks/useRefreshEffect';
import { AppState, useAppDispatch } from 'src/state';

import { fetchTokenStatsAsync } from './reducer';

export const usePollTokenStats = () => {
  const dispatch = useAppDispatch();

  useSlowRefreshEffect(() => {
    dispatch(fetchTokenStatsAsync());
  }, [dispatch]);
};

export const useTokenStats = () => {
  const token = useSelector((state: AppState) => state.token);
  const { stats } = token;

  const tokenStats = {
    totalTransferEventCount: 0,
    holders: 0,
    totalSupply: new BigNumber(0),
  };

  SUPPORTED_CHAIN_IDS.forEach((chainId) => {
    if (stats[chainId] && !TESTNET_CHAIN_IDS.includes(chainId)) {
      tokenStats.totalTransferEventCount +=
        stats[chainId]?.totalTransferEventCount!;
      tokenStats.holders += stats[chainId]?.holders!;
      tokenStats.totalSupply = tokenStats.totalSupply.plus(
        new BigNumber(token.stats[chainId]?.totalSupply ?? '0')
      );
    }
  });

  return {
    ...tokenStats,
    totalSupply: tokenStats.totalSupply.toJSON(),
  };
};

export const useTokenStatsLoaded = () => {
  const token = useSelector((state: AppState) => state.token);

  return token.statsLoaded;
};
