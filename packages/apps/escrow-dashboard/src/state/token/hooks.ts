import { ChainId } from '@human-protocol/sdk';
import BigNumberJS from 'bignumber.js';
import { useSelector } from 'react-redux';

import { AppState, useAppDispatch } from '..';
import { useChainId } from '../escrow/hooks';
import { fetchTokenStatsAsync } from './reducer';
import { L1_L2_CHAIN_IDS, TESTNET_CHAIN_IDS } from 'src/constants';
import { useSlowRefreshEffect } from 'src/hooks/useRefreshEffect';

export const usePollTokenStats = () => {
  const dispatch = useAppDispatch();

  useSlowRefreshEffect(() => {
    dispatch(fetchTokenStatsAsync());
  }, [dispatch]);
};

export const useTokenStatsByChainId = () => {
  const currentChainId = useChainId();
  const token = useSelector((state: AppState) => state.token);
  const { stats } = token;

  let mainnetTotalSupply = new BigNumberJS(
    token.stats[ChainId.MAINNET]?.totalSupply ?? '0'
  );
  let bridgedTotalSupply = new BigNumberJS(0);
  L1_L2_CHAIN_IDS.forEach((chainId) => {
    if (stats[chainId]) {
      bridgedTotalSupply = bridgedTotalSupply.plus(
        new BigNumberJS(token.stats[chainId]?.totalSupply ?? '0')
      );
    }
  });

  if (
    currentChainId === ChainId.ALL ||
    TESTNET_CHAIN_IDS.includes(currentChainId)
  ) {
    const tokenStats = {
      totalTransferEventCount: 0,
      holders: 0,
    };

    L1_L2_CHAIN_IDS.forEach((chainId) => {
      if (stats[chainId]) {
        tokenStats.totalTransferEventCount +=
          stats[chainId]?.totalTransferEventCount!;
        tokenStats.holders += stats[chainId]?.holders!;
      }
    });

    return {
      ...tokenStats,
      totalSupply: mainnetTotalSupply.toJSON(),
    };
  }
  if (currentChainId === ChainId.MAINNET) {
    return {
      ...stats[currentChainId],
      totalSupply: mainnetTotalSupply.minus(bridgedTotalSupply).toJSON(),
    };
  }

  return stats[currentChainId]!;
};

export const useTokenStatsLoaded = () => {
  const token = useSelector((state: AppState) => state.token);

  return token.statsLoaded;
};
