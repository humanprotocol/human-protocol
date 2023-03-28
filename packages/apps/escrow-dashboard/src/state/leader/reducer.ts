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
import stringify from 'fast-json-stable-stringify';

import { LeaderData, LeaderEscrowData } from './types';

import { ChainId, SUPPORTED_CHAIN_IDS, ESCROW_NETWORKS } from 'src/constants';
import {
  RAW_DATA_SAVED_EVENTS_QUERY,
  RAW_LEADERS_QUERY,
  RAW_LEADER_ESCROWS_QUERY,
  RAW_LEADER_QUERY,
} from 'src/queries';
import { AppState } from 'src/state';
import { formatAmount } from 'src/utils';
import { gqlFetch } from 'src/utils/gqlFetch';

type LeadersType = { [chainId in ChainId]?: LeaderData[] };

type LeaderState = {
  loadingKeys: Record<string, boolean>;
  chainId: ChainId;

  leaders: LeadersType;
  leadersLoaded: boolean;

  currentLeader?: LeaderData;
  currentLeaderLoaded?: boolean;

  leaderEscrows?: LeaderEscrowData[];
  leaderEscrowsLoaded?: boolean;
};

const initialState: LeaderState = {
  loadingKeys: {},
  chainId: ChainId.ALL,
  leaders: {},
  leadersLoaded: false,
};

export const fetchLeadersAsync = createAsyncThunk<
  LeadersType,
  void,
  { state: AppState }
>('leader/fetchLeadersAsync', async () => {
  const leaders = (
    await Promise.all(
      SUPPORTED_CHAIN_IDS.map(async (chainId) => {
        return {
          chainId,
          leaders: await getLeaders(ESCROW_NETWORKS[chainId]?.subgraphUrl!),
        };
      })
    )
  ).reduce((leaders, { chainId, leaders: chainLeaders }) => {
    leaders[chainId] = chainLeaders;
    return leaders;
  }, {} as LeadersType);

  return leaders;
});

const getLeaders = async (subgraphUrl: string) => {
  return await gqlFetch(subgraphUrl!, RAW_LEADERS_QUERY)
    .then((res) => res.json())
    .then((json) =>
      json.data.leaders
        .map((leader: any) => ({
          address: leader.address,
          role: leader.role,
          amountStaked: formatAmount(leader.amountStaked),
          amountAllocated: formatAmount(leader.amountAllocated),
          amountLocked: formatAmount(leader.amountLocked),
          amountSlashed: formatAmount(leader.amountSlashed),
          amountWithdrawn: formatAmount(leader.amountWithdrawn),
          lockedUntilTimestamp: Number(leader.lockedUntilTimestamp),
          reputation: Number(leader.reputation),
          amountJobsLaunched: Number(leader.amountJobsLaunched),
        }))
        .filter((leader: LeaderData) => Number(leader.amountStaked) > 0)
    )
    .catch((err) => []);
};

export const fetchLeaderAsync = createAsyncThunk<
  LeaderData,
  { chainId: ChainId; address: string },
  { state: AppState }
>('leader/fetchLeaderAsync', async ({ chainId, address }) => {
  const leader = await getLeader(
    ESCROW_NETWORKS[chainId]?.subgraphUrl!,
    address
  );

  if (!leader) {
    throw new Error('Error fetching leader detail');
  }

  return {
    ...leader,
    chainId: chainId,
  };
});

const getLeader = async (
  subgraphUrl: string,
  address: string
): Promise<Omit<LeaderData, 'chainId'> | undefined> => {
  const leaderData: Omit<LeaderData, 'chainId'> | undefined = await gqlFetch(
    subgraphUrl!,
    RAW_LEADER_QUERY(address)
  )
    .then((res) => res.json())
    .then((json) => ({
      address: json.data.leader.address,
      role: json.data.leader.role,
      amountStaked: formatAmount(json.data.leader.amountStaked),
      amountAllocated: formatAmount(json.data.leader.amountAllocated),
      amountLocked: formatAmount(json.data.leader.amountLocked),
      amountSlashed: formatAmount(json.data.leader.amountSlashed),
      amountWithdrawn: formatAmount(json.data.leader.amountWithdrawn),
      lockedUntilTimestamp: Number(json.data.leader.lockedUntilTimestamp),
      reputation: Number(json.data.leader.reputation),
      amountJobsLaunched: Number(json.data.leader.amountJobsLaunched),
    }))
    .catch((err) => undefined);

  if (leaderData) {
    const urls = await gqlFetch(subgraphUrl!, RAW_DATA_SAVED_EVENTS_QUERY, {
      key: 'url',
      leader: leaderData.address,
    })
      .then((res) => res.json())
      .then((json) =>
        json.data.dataSavedEvents.map((event: { value: any }) => event.value)
      );

    return { ...leaderData, url: urls[0] };
  }
};

export const fetchLeaderEscrowsAsync = createAsyncThunk<
  LeaderEscrowData[],
  { chainId: ChainId; address: string },
  { state: AppState }
>('leader/fetchLeaderEscrowsAsync', async ({ chainId, address }) => {
  return await getLeaderEscrows(
    ESCROW_NETWORKS[chainId]?.subgraphUrl!,
    address
  );
});

const getLeaderEscrows = async (subgraphUrl: string, address: string) => {
  return await gqlFetch(subgraphUrl!, RAW_LEADER_ESCROWS_QUERY(address))
    .then((res) => res.json())
    .then((json) =>
      json.data.launchedEscrows.map((escrow: any) => ({
        address: escrow.id,
        amountAllocated: formatAmount(escrow.amountAllocated ?? '0'),
        amountPayout: formatAmount(escrow.amountPayout ?? '0'),
        status: escrow.status,
      }))
    )
    .catch((err) => []);
};

export const setChainId = createAction<ChainId>('leader/setChainId');

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
  builder.addCase(fetchLeadersAsync.fulfilled, (state, action) => {
    state.leaders = action.payload;
    state.leadersLoaded = true;
  });

  builder.addCase(fetchLeaderAsync.fulfilled, (state, action) => {
    state.currentLeader = action.payload;
    state.currentLeaderLoaded = true;
  });
  builder.addCase(fetchLeaderAsync.rejected, (state, action) => {
    state.currentLeaderLoaded = true;
  });

  builder.addCase(fetchLeaderEscrowsAsync.fulfilled, (state, action) => {
    state.leaderEscrows = action.payload;
    state.leaderEscrowsLoaded = true;
  });
  builder.addCase(fetchLeaderEscrowsAsync.rejected, (state, action) => {
    state.leaderEscrowsLoaded = true;
  });

  builder.addMatcher(
    isAnyOf(
      fetchLeadersAsync.pending,
      fetchLeaderAsync.pending,
      fetchLeaderEscrowsAsync.pending
    ),
    (state, action) => {
      state.loadingKeys[serializeLoadingKey(action, 'pending')] = true;
    }
  );
  builder.addMatcher(
    isAnyOf(
      fetchLeadersAsync.fulfilled,
      fetchLeaderAsync.fulfilled,
      fetchLeaderEscrowsAsync.fulfilled
    ),
    (state, action) => {
      state.loadingKeys[serializeLoadingKey(action, 'fulfilled')] = false;
    }
  );
  builder.addMatcher(
    isAnyOf(
      fetchLeadersAsync.rejected,
      fetchLeaderAsync.rejected,
      fetchLeaderEscrowsAsync.rejected
    ),
    (state, action) => {
      state.loadingKeys[serializeLoadingKey(action, 'rejected')] = false;
    }
  );
});
