import { useSelector } from 'react-redux';
import { ChainId, SUPPORTED_CHAIN_IDS } from 'src/constants';
import { useSlowRefreshEffect } from 'src/hooks/useRefreshEffect';
import { AppState, useAppDispatch } from 'src/state';

import {
  fetchEscrowAmountsAsync,
  fetchEscrowEventsAsync,
  fetchEscrowStatsAsync,
} from './reducer';
import { EscrowData } from './types';

export const usePollEventsData = () => {
  const dispatch = useAppDispatch();

  useSlowRefreshEffect(() => {
    dispatch(fetchEscrowEventsAsync());
    dispatch(fetchEscrowStatsAsync());
    dispatch(fetchEscrowAmountsAsync());
  }, [dispatch]);
};

export const useEscrowDataByChainID = (chainId: ChainId): EscrowData => {
  const escrow = useSelector((state: AppState) => state.escrow);
  const { amounts, stats, events } = escrow;

  if (chainId === ChainId.ALL) {
    const escrowData: EscrowData = {
      amount: 0,
      stats: {
        bulkTransferEventCount: 0,
        intermediateStorageEventCount: 0,
        pendingEventCount: 0,
        totalEventCount: 0,
      },
      lastMonthEvents: [],
    };

    SUPPORTED_CHAIN_IDS.forEach((chainId) => {
      if (amounts[chainId]) {
        escrowData.amount += amounts[chainId]!;
      }
      if (stats[chainId]) {
        escrowData.stats.bulkTransferEventCount +=
          stats[chainId]?.bulkTransferEventCount!;
        escrowData.stats.pendingEventCount +=
          stats[chainId]?.pendingEventCount!;
        escrowData.stats.intermediateStorageEventCount +=
          stats[chainId]?.intermediateStorageEventCount!;
        escrowData.stats.totalEventCount += stats[chainId]?.totalEventCount!;
      }
      if (Array.isArray(events[chainId])) {
        events[chainId]?.forEach((e1) => {
          const index = escrowData.lastMonthEvents.findIndex(
            (e) => e.timestamp === e1.timestamp
          );
          if (index >= 0) {
            escrowData.lastMonthEvents[index].dailyBulkTransferEvents +=
              e1.dailyBulkTransferEvents;
            escrowData.lastMonthEvents[index].dailyEscrowAmounts +=
              e1.dailyEscrowAmounts;
            escrowData.lastMonthEvents[index].dailyIntermediateStorageEvents +=
              e1.dailyIntermediateStorageEvents;
            escrowData.lastMonthEvents[index].dailyPendingEvents +=
              e1.dailyPendingEvents;
          } else {
            escrowData.lastMonthEvents.push({ ...e1 });
          }
        });
      }
    });

    escrowData.lastMonthEvents = escrowData.lastMonthEvents
      .sort((x, y) => Number(y.timestamp) - Number(x.timestamp))
      .slice(0, 30)
      .reverse();

    return escrowData;
  }

  return {
    amount: amounts[chainId] ?? 0,
    stats: stats[chainId] ?? {
      pendingEventCount: 0,
      bulkTransferEventCount: 0,
      intermediateStorageEventCount: 0,
      totalEventCount: 0,
    },
    lastMonthEvents: events[chainId] ?? [],
  };
};

export const useEscrowDataLoaded = () => {
  const escrow = useSelector((state: AppState) => state.escrow);

  return escrow.eventsLoaded && escrow.amountsLoaded && escrow.statsLoaded;
};
