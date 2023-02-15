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
import { ChainId, SUPPORTED_CHAIN_IDS, ESCROW_NETWORKS } from 'src/constants';
import { RAW_LEADERS_QUERY, RAW_LEADER_QUERY } from 'src/queries';
import { AppState } from 'src/state';
import { gqlFetch } from 'src/utils/gqlFetch';

import { LeaderData } from './types';

type LeadersType = { [chainId in ChainId]?: LeaderData[] };

interface LeaderState {
  loadingKeys: Record<string, boolean>;
  chainId: ChainId;

  leaders: LeadersType;
  leadersLoaded: boolean;

  currentLeader?: LeaderData;
  currentLeaderLoaded?: boolean;
}

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

const getLeaders = async (subgraphUrl: string) => {
  return await gqlFetch(subgraphUrl!, RAW_LEADERS_QUERY)
    .then((res) => res.json())
    .then((json) =>
      json.data.leaders.map((leader: any) => ({
        address: leader.address,
        role: leader.role,
        amountStaked: Number(leader.amountStaked),
        amountAllocated: Number(leader.amountAllocated),
        amountLocked: Number(leader.amountLocked),
        amountSlashed: Number(leader.amountSlashed),
        amountWithdrawn: Number(leader.amountWithdrawn),
        lockedUntilTimestamp: Number(leader.lockedUntilTimestamp),
        reputation: Number(leader.reputation),
        amountJobsLaunched: Number(leader.amountJobsLaunched),
      }))
    )
    .catch((err) => []);
};

const getLeader = async (
  subgraphUrl: string,
  address: string
): Promise<Omit<LeaderData, 'chainId'> | undefined> => {
  return await gqlFetch(subgraphUrl!, RAW_LEADER_QUERY(address))
    .then((res) => res.json())
    .then((json) => ({
      address: json.data.leader.address,
      role: json.data.leader.role,
      amountStaked: Number(json.data.leader.amountStaked),
      amountAllocated: Number(json.data.leader.amountAllocated),
      amountLocked: Number(json.data.leader.amountLocked),
      amountSlashed: Number(json.data.leader.amountSlashed),
      amountWithdrawn: Number(json.data.leader.amountWithdrawn),
      lockedUntilTimestamp: Number(json.data.leader.lockedUntilTimestamp),
      reputation: Number(json.data.leader.reputation),
      amountJobsLaunched: Number(json.data.leader.amountJobsLaunched),
    }))
    .catch((err) => undefined);
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
  builder.addMatcher(isAnyOf(fetchLeaderAsync.rejected), (state, action) => {
    state.currentLeaderLoaded = true;
  });

  builder.addMatcher(
    isAnyOf(fetchLeadersAsync.pending, fetchLeaderAsync.pending),
    (state, action) => {
      state.loadingKeys[serializeLoadingKey(action, 'pending')] = true;
    }
  );
  builder.addMatcher(
    isAnyOf(fetchLeadersAsync.fulfilled, fetchLeaderAsync.pending),
    (state, action) => {
      state.loadingKeys[serializeLoadingKey(action, 'fulfilled')] = false;
    }
  );
  builder.addMatcher(
    isAnyOf(fetchLeadersAsync.rejected, fetchLeaderAsync.rejected),
    (state, action) => {
      state.loadingKeys[serializeLoadingKey(action, 'rejected')] = false;
    }
  );
});
