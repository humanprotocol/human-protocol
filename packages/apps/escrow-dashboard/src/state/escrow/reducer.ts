import EscrowFactoryABI from '@human-protocol/core/abis/EscrowFactory.json';
import { ChainId, NETWORKS } from '@human-protocol/sdk';
import {
  createAction,
  createAsyncThunk,
  createReducer,
  isAnyOf,
} from '@reduxjs/toolkit';
import {
  UnknownAsyncThunkFulfilledAction,
  UnknownAsyncThunkPendingAction,
  UnknownAsyncThunkRejectedAction,
} from '@reduxjs/toolkit/dist/matchers';
import { Contract, providers } from 'ethers';
import stringify from 'fast-json-stable-stringify';
import { AppState } from '..';
import { EscrowEventDayData, EscrowStats } from './types';
import { RPC_URLS, SUPPORTED_CHAIN_IDS } from 'src/constants';
import rinkebyEscrowAmount from 'src/history-data/rinkeby_EscrowAmount.json';
import rinkebyEscrowEvents from 'src/history-data/rinkeby_EscrowEvents.json';
import rinkebyEscrowStats from 'src/history-data/rinkeby_EscrowStats.json';
import { RAW_ESCROW_STATS_QUERY, RAW_EVENT_DAY_DATA_QUERY } from 'src/queries';
import { gqlFetch } from 'src/utils/gqlFetch';

type EscrowEventsType = { [chainId in ChainId]?: EscrowEventDayData[] };

type EscrowStatsType = { [chainId in ChainId]?: EscrowStats };

type EscrowAmountsType = { [chainId in ChainId]?: number };

type EscrowState = {
  loadingKeys: Record<string, boolean>;
  chainId: ChainId;
  events: EscrowEventsType;
  eventsLoaded: boolean;
  stats: EscrowStatsType;
  statsLoaded: boolean;
  amounts: EscrowAmountsType;
  amountsLoaded: boolean;
  range: number;
};

const initialState: EscrowState = {
  loadingKeys: {},
  chainId: ChainId.ALL,
  events: {},
  eventsLoaded: false,
  stats: {},
  statsLoaded: false,
  amounts: {},
  amountsLoaded: false,
  range: 30,
};

export const fetchEscrowEventsAsync = createAsyncThunk<
  EscrowEventsType,
  number,
  { state: AppState }
>('escrow/fetchEscrowEventsAsync', async (days: number) => {
  let escrowEvents: EscrowEventsType = {};
  await Promise.all(
    SUPPORTED_CHAIN_IDS.map(async (chainId) => {
      if (chainId === ChainId.RINKEBY) {
        escrowEvents[chainId] = rinkebyEscrowEvents as any;
      } else {
        let eventDayDatas = await getEventDayData(
          NETWORKS[chainId]?.subgraphUrl!,
          days
        );

        if (NETWORKS[chainId]?.oldSubgraphUrl && eventDayDatas.length < days) {
          const oldData = await getEventDayData(
            NETWORKS[chainId]?.oldSubgraphUrl!,
            days - eventDayDatas.length
          );
          eventDayDatas = eventDayDatas.concat(oldData);
        }
        escrowEvents[chainId] = eventDayDatas;
      }
    })
  );

  return escrowEvents;
});

const getEventDayData = async (subgraphUrl: string, count: number) => {
  return await gqlFetch(
    subgraphUrl!,
    RAW_EVENT_DAY_DATA_QUERY.replace('[COUNT_PARAM]', count.toString())
  )
    .then((res) => res.json())
    .then((json) =>
      json.data.eventDayDatas.map((d: EscrowEventDayData) => ({
        ...d,
        dailyBulkTransferEvents: Number(d.dailyBulkTransferEvents),
        dailyIntermediateStorageEvents: Number(
          d.dailyIntermediateStorageEvents
        ),
        dailyPendingEvents: Number(d.dailyPendingEvents),
        dailyTotalEvents:
          Number(d.dailyBulkTransferEvents) +
          Number(d.dailyIntermediateStorageEvents) +
          Number(d.dailyPendingEvents),
        dailyEscrowAmounts: Number(d.dailyEscrowAmounts),
      }))
    )
    .catch((err) => []);
};

export const fetchEscrowStatsAsync = createAsyncThunk<
  EscrowStatsType,
  void,
  { state: AppState }
>('escrow/fetchEscrowStatsAsync', async () => {
  let escrowStats: EscrowStatsType = {};
  await Promise.all(
    SUPPORTED_CHAIN_IDS.map(async (chainId) => {
      if (chainId === ChainId.RINKEBY) {
        escrowStats[chainId] = rinkebyEscrowStats;
      } else {
        const stats = await getEscrowStats(NETWORKS[chainId]?.subgraphUrl!);
        if (NETWORKS[chainId]?.oldSubgraphUrl) {
          const oldStats = await getEscrowStats(
            NETWORKS[chainId]?.oldSubgraphUrl!
          );
          stats.bulkTransferEventCount += oldStats.bulkTransferEventCount;
          stats.intermediateStorageEventCount +=
            oldStats.intermediateStorageEventCount;
          stats.pendingEventCount += oldStats.pendingEventCount;
          stats.totalEventCount += oldStats.totalEventCount;
        }
        escrowStats[chainId] = stats;
      }
    })
  );

  return escrowStats;
});

const getEscrowStats = async (subgraphUrl: string) => {
  return await gqlFetch(subgraphUrl, RAW_ESCROW_STATS_QUERY)
    .then((res) => res.json())
    .then((json) => {
      if (!json.data.escrowStatistics) {
        return {
          intermediateStorageEventCount: 0,
          pendingEventCount: 0,
          bulkTransferEventCount: 0,
          totalEventCount: 0,
        };
      }
      const {
        intermediateStorageEventCount,
        pendingEventCount,
        bulkTransferEventCount,
      } = json.data.escrowStatistics;

      return {
        intermediateStorageEventCount: Number(intermediateStorageEventCount),
        pendingEventCount: Number(pendingEventCount),
        bulkTransferEventCount: Number(bulkTransferEventCount),
        totalEventCount:
          Number(intermediateStorageEventCount) +
          Number(pendingEventCount) +
          Number(bulkTransferEventCount),
      };
    })
    .catch((err) => ({
      intermediateStorageEventCount: 0,
      pendingEventCount: 0,
      bulkTransferEventCount: 0,
      totalEventCount: 0,
    }));
};

export const fetchEscrowAmountsAsync = createAsyncThunk<
  EscrowAmountsType,
  void,
  { state: AppState }
>('escrow/fetchEscrowAmountsAsync', async () => {
  let escrowAmounts: EscrowAmountsType = {};
  await Promise.all(
    SUPPORTED_CHAIN_IDS.map(async (chainId) => {
      if (chainId === ChainId.RINKEBY) {
        escrowAmounts[chainId] = rinkebyEscrowAmount;
      } else if (RPC_URLS[chainId]) {
        const factoryAddress = NETWORKS[chainId]?.factoryAddress!;
        const provider = new providers.JsonRpcProvider(RPC_URLS[chainId]);
        let contract = new Contract(factoryAddress, EscrowFactoryABI, provider);
        let escrowAmount = Number(await contract.counter());
        if (NETWORKS[chainId]?.oldFactoryAddress) {
          contract = new Contract(
            NETWORKS[chainId]?.oldFactoryAddress!,
            EscrowFactoryABI,
            provider
          );
          escrowAmount += Number(await contract.counter());
        }
        escrowAmounts[chainId] = Number(escrowAmount);
      }
    })
  );

  return escrowAmounts;
});

export const setChainId = createAction<ChainId>('escrow/setChainId');

export const setRange = createAction<number>('escrow/setRange');

type UnknownAsyncThunkFulfilledOrPendingAction =
  | UnknownAsyncThunkFulfilledAction
  | UnknownAsyncThunkPendingAction
  | UnknownAsyncThunkRejectedAction;

const serializeLoadingKey = (
  action: UnknownAsyncThunkFulfilledOrPendingAction,
  suffix: UnknownAsyncThunkFulfilledOrPendingAction['meta']['requestStatus']
) => {
  const type = action.type.split(`/${suffix}`)[0];
  return stringify({
    arg: action.meta.arg,
    type,
  });
};

export default createReducer(initialState, (builder) => {
  builder.addCase(setChainId, (state, action) => {
    state.chainId = action.payload;
  });
  builder.addCase(setRange, (state, action) => {
    state.range = action.payload;
  });
  builder.addCase(fetchEscrowEventsAsync.fulfilled, (state, action) => {
    state.events = action.payload;
    state.eventsLoaded = true;
  });
  builder.addCase(fetchEscrowStatsAsync.fulfilled, (state, action) => {
    state.stats = action.payload;
    state.statsLoaded = true;
  });
  builder.addCase(fetchEscrowAmountsAsync.fulfilled, (state, action) => {
    state.amounts = action.payload;
    state.amountsLoaded = true;
  });

  builder.addMatcher(
    isAnyOf(
      fetchEscrowEventsAsync.pending,
      fetchEscrowStatsAsync.pending,
      fetchEscrowAmountsAsync.pending
    ),
    (state, action) => {
      state.loadingKeys[serializeLoadingKey(action, 'pending')] = true;
    }
  );
  builder.addMatcher(
    isAnyOf(
      fetchEscrowEventsAsync.fulfilled,
      fetchEscrowStatsAsync.fulfilled,
      fetchEscrowAmountsAsync.fulfilled
    ),
    (state, action) => {
      state.loadingKeys[serializeLoadingKey(action, 'fulfilled')] = false;
    }
  );
  builder.addMatcher(
    isAnyOf(
      fetchEscrowEventsAsync.rejected,
      fetchEscrowStatsAsync.rejected,
      fetchEscrowAmountsAsync.rejected
    ),
    (state, action) => {
      state.loadingKeys[serializeLoadingKey(action, 'rejected')] = false;
    }
  );
});
