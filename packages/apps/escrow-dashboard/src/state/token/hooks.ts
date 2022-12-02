import BigNumber from 'bignumber.js';
import { useSelector } from 'react-redux';
import { ChainId, SUPPORTED_CHAIN_IDS } from 'src/constants';
import { useSlowRefreshEffect } from 'src/hooks/useRefreshEffect';
import { AppState, useAppDispatch } from 'src/state';
import { useChainId } from '../escrow/hooks';

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
  };

  SUPPORTED_CHAIN_IDS.forEach((chainId) => {
    if (stats[chainId]) {
      tokenStats.totalTransferEventCount += stats[
        chainId
      ]?.totalTransferEventCount!;
      tokenStats.holders += stats[chainId]?.holders!;
    }
  });

  return tokenStats;
};

export const useTotalSupply = () => {
  const chainId = useChainId();
  const token = useSelector((state: AppState) => state.token);

  if (chainId === ChainId.ALL) {
    let allTotalSupplyBN = new BigNumber(0);
    SUPPORTED_CHAIN_IDS.forEach((chainId) => {
      allTotalSupplyBN = allTotalSupplyBN.plus(
        new BigNumber(token.stats[chainId]?.totalSupply ?? '0')
      );
    });

    return allTotalSupplyBN.toJSON();
  }

  return token.stats[chainId]?.totalSupply;
};

export const useTokenStatsLoaded = () => {
  const token = useSelector((state: AppState) => state.token);

  return token.statsLoaded;
};
