import { ChainId, EscrowUtils, OperatorUtils } from '@human-protocol/sdk';
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
import { V2_SUPPORTED_CHAIN_IDS } from 'src/constants';
import { AppState } from 'src/state';
import { formatAmount } from 'src/utils';

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
      V2_SUPPORTED_CHAIN_IDS.map(async (chainId) => {
        const leaders = await OperatorUtils.getLeaders({
          chainId,
        });

        return {
          chainId,
          leaders: leaders.map((leader) => ({
            chainId,
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
          })),
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
  const leader = await OperatorUtils.getLeader(chainId, address);

  if (!leader) {
    throw new Error('Error fetching leader detail');
  }

  return {
    chainId: chainId,
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
    url: leader.url,
  };
});

export const fetchLeaderEscrowsAsync = createAsyncThunk<
  LeaderEscrowData[],
  { chainId: ChainId; address: string },
  { state: AppState }
>('leader/fetchLeaderEscrowsAsync', async ({ chainId, address }) => {
  const launchedEscrows = await EscrowUtils.getEscrows({
    chainId: chainId,
    launcher: address,
  });

  return launchedEscrows.map((escrow) => ({
    address: escrow.address,
    amountAllocated: formatAmount(escrow.totalFundedAmount),
    amountPayout: formatAmount(escrow.amountPaid),
    status: escrow.status,
  }));
});

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
