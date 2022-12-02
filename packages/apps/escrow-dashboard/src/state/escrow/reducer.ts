import EscrowFactoryABI from '@human-protocol/core/abis/EscrowFactory.json';
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
import { ChainId, SUPPORTED_CHAIN_IDS, ESCROW_NETWORKS } from 'src/constants';
import { RAW_ESCROW_STATS_QUERY, RAW_EVENT_DAY_DATA_QUERY } from 'src/queries';
import { AppState } from 'src/state';
import { gqlFetch } from 'src/utils/gqlFetch';

import { EscrowEventDayData, EscrowStats } from './types';

type EscrowEventsType = { [chainId in ChainId]?: EscrowEventDayData[] };

type EscrowStatsType = { [chainId in ChainId]?: EscrowStats };

type EscrowAmountsType = { [chainId in ChainId]?: number };

interface EscrowState {
  loadingKeys: Record<string, boolean>;
  chainId: ChainId;
  events: EscrowEventsType;
  eventsLoaded: boolean;
  stats: EscrowStatsType;
  statsLoaded: boolean;
  amounts: EscrowAmountsType;
  amountsLoaded: boolean;
}

const initialState: EscrowState = {
  loadingKeys: {},
  chainId: ChainId.ALL,
  events: {},
  eventsLoaded: false,
  stats: {},
  statsLoaded: false,
  amounts: {},
  amountsLoaded: false,
};

export const fetchEscrowEventsAsync = createAsyncThunk<
  EscrowEventsType,
  void,
  { state: AppState }
>('escrow/fetchEscrowEventsAsync', async () => {
  let escrowEvents: EscrowEventsType = {};
  await Promise.all(
    SUPPORTED_CHAIN_IDS.map(async (chainId) => {
      const eventDayDatas = await gqlFetch(
        ESCROW_NETWORKS[chainId]?.subgraphUrl!,
        RAW_EVENT_DAY_DATA_QUERY
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
        );
      escrowEvents[chainId] = eventDayDatas;
    })
  );

  return escrowEvents;
});

export const fetchEscrowStatsAsync = createAsyncThunk<
  EscrowStatsType,
  void,
  { state: AppState }
>('escrow/fetchEscrowStatsAsync', async () => {
  let escrowStats: EscrowStatsType = {};
  await Promise.all(
    SUPPORTED_CHAIN_IDS.map(async (chainId) => {
      const stats = await gqlFetch(
        ESCROW_NETWORKS[chainId]?.subgraphUrl!,
        RAW_ESCROW_STATS_QUERY
      )
        .then((res) => res.json())
        .then((json) => {
          const {
            intermediateStorageEventCount,
            pendingEventCount,
            bulkTransferEventCount,
          } = json.data.escrowStatistics;

          return {
            intermediateStorageEventCount: Number(
              intermediateStorageEventCount
            ),
            pendingEventCount: Number(pendingEventCount),
            bulkTransferEventCount: Number(bulkTransferEventCount),
            totalEventCount:
              Number(intermediateStorageEventCount) +
              Number(pendingEventCount) +
              Number(bulkTransferEventCount),
          };
        });
      escrowStats[chainId] = stats;
    })
  );

  return escrowStats;
});

export const fetchEscrowAmountsAsync = createAsyncThunk<
  EscrowAmountsType,
  void,
  { state: AppState }
>('escrow/fetchEscrowAmountsAsync', async () => {
  let escrowAmounts: EscrowAmountsType = {};
  await Promise.all(
    SUPPORTED_CHAIN_IDS.map(async (chainId) => {
      const rpcUrl = ESCROW_NETWORKS[chainId]?.rpcUrl!;
      const factoryAddress = ESCROW_NETWORKS[chainId]?.factoryAddress!;
      const provider = new providers.JsonRpcProvider(rpcUrl);
      const contract = new Contract(factoryAddress, EscrowFactoryABI, provider);
      const escrowAmount = await contract.counter();
      escrowAmounts[chainId] = Number(escrowAmount);
    })
  );

  return escrowAmounts;
});

export const setChainId = createAction<ChainId>('escrow/setChainId');

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
