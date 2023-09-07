import { ChainId } from '@human-protocol/sdk';
import BigNumberJS from 'bignumber.js';
import { utils } from 'ethers';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { AppState, useAppDispatch } from '..';
import { fetchHumanAppData } from './reducer';
import { HM_TOKEN_DECIMALS, L1_L2_CHAIN_IDS } from 'src/constants';

export const useHumanAppData = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchHumanAppData());
  }, [dispatch]);
};

export const useChainId = () => {
  const { chainId } = useSelector((state: AppState) => state.humanAppData);
  return chainId;
};

export const useEscrowStatisticsByChainId = () => {
  const { humanAppData } = useSelector((state: AppState) => state);
  const { data, chainId, days } = humanAppData;

  return data[chainId]?.escrowStatistics?.dailyEscrowsData
    .slice(0, days)
    .reverse()
    .map((d) => ({
      ...d,
      timestamp: d.timestamp.getTime(),
    }));
};

export const useWokerStatisticsByChainId = () => {
  const { humanAppData } = useSelector((state: AppState) => state);
  const { data, chainId, days } = humanAppData;

  return data[chainId]?.workerStatistics?.dailyWorkersData
    .slice(0, days)
    .reverse()
    .map((d) => ({
      ...d,
      timestamp: d.timestamp.getTime(),
    }));
};

export const usePaymentStatisticsByChainId = () => {
  const { humanAppData } = useSelector((state: AppState) => state);
  const { data, chainId, days } = humanAppData;

  return data[chainId]?.paymentStatistics?.dailyPaymentsData
    .slice(0, days)
    .reverse()
    .map((d) => ({
      timestamp: d.timestamp.getTime(),
      totalAmountPaid: utils.formatUnits(d.totalAmountPaid, HM_TOKEN_DECIMALS),
      totalCount: d.totalCount,
      averageAmountPerJob: utils.formatUnits(
        d.averageAmountPerJob,
        HM_TOKEN_DECIMALS
      ),
      averageAmountPerWorker: utils.formatUnits(
        d.averageAmountPerWorker,
        HM_TOKEN_DECIMALS
      ),
    }));
};

export const useHMTStatisticsByChainId = () => {
  const { humanAppData } = useSelector((state: AppState) => state);
  const { data, chainId, days } = humanAppData;

  return data[chainId]?.hmtStatistics?.dailyHMTData
    .slice(0, days)
    .reverse()
    .map((d) => ({
      timestamp: d.timestamp.getTime(),
      totalTransactionCount: d.totalTransactionCount,
      totalTransactionAmount: utils.formatUnits(
        d.totalTransactionAmount,
        HM_TOKEN_DECIMALS
      ),
    }));
};

export const useTokenStatsByChainId = () => {
  const currentChainId = useChainId();
  const { humanAppData } = useSelector((state: AppState) => state);
  const { data } = humanAppData;

  let mainnetTotalSupply = new BigNumberJS(
    data[ChainId.MAINNET]?.hmtTotalSupply ?? '0'
  );

  let bridgedTotalSupply = new BigNumberJS(0);
  L1_L2_CHAIN_IDS.forEach((chainId) => {
    if (data[chainId]) {
      bridgedTotalSupply = bridgedTotalSupply.plus(
        new BigNumberJS(data[chainId]?.hmtTotalSupply ?? '0')
      );
    }
  });

  if (currentChainId === ChainId.ALL) {
    const tokenStats = {
      totalTransferAmount: new BigNumberJS('0'),
      holders: 0,
    };

    L1_L2_CHAIN_IDS.forEach((chainId) => {
      if (data[chainId]) {
        tokenStats.totalTransferAmount = tokenStats.totalTransferAmount.plus(
          utils.formatUnits(
            data[chainId]?.hmtStatistics.totalTransferAmount!,
            HM_TOKEN_DECIMALS
          )
        );
        tokenStats.holders += data[chainId]?.hmtStatistics.totalHolders!;
      }
    });

    return {
      totalTransferAmount: tokenStats.totalTransferAmount.toJSON(),
      holders: tokenStats.holders,
      totalSupply: mainnetTotalSupply.toJSON(),
    };
  }

  const stats = data[currentChainId]?.hmtStatistics;

  if (currentChainId === ChainId.MAINNET) {
    return {
      totalTransferAmount: stats
        ? utils.formatUnits(stats.totalTransferAmount, HM_TOKEN_DECIMALS)
        : '0',
      holders: stats?.totalHolders ?? '0',
      totalSupply: mainnetTotalSupply.minus(bridgedTotalSupply).toJSON(),
    };
  }

  return {
    totalTransferAmount: stats
      ? utils.formatUnits(stats.totalTransferAmount!, HM_TOKEN_DECIMALS)
      : '0',
    holders: stats?.totalHolders ?? '0',
    totalSupply: data[currentChainId]?.hmtTotalSupply ?? '0',
  };
};

export const useHumanAppDataLoaded = () => {
  const humanAppData = useSelector((state: AppState) => state.humanAppData);

  return humanAppData.dataLoaded;
};
