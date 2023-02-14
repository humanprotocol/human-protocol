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
import { RAW_LEADERS_QUERY } from 'src/queries';
import { AppState } from 'src/state';
import { gqlFetch } from 'src/utils/gqlFetch';

import { LeaderData } from './types';

type LeadersType = { [chainId in ChainId]?: LeaderData[] };

interface LeaderState {
  loadingKeys: Record<string, boolean>;
  chainId: ChainId;
  leaders: LeadersType;
  leadersLoaded: boolean;
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

const getLeaders = async (subgraphUrl: string) => {
  return await gqlFetch(subgraphUrl!, RAW_LEADERS_QUERY)
    .then((res) => res.json())
    .then((json) => json.data.leaders)
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
    console.log(state, action);
    state.leaders = action.payload;
    state.leadersLoaded = true;
  });

  builder.addMatcher(isAnyOf(fetchLeadersAsync.pending), (state, action) => {
    state.loadingKeys[serializeLoadingKey(action, 'pending')] = true;
  });
  builder.addMatcher(isAnyOf(fetchLeadersAsync.fulfilled), (state, action) => {
    state.loadingKeys[serializeLoadingKey(action, 'fulfilled')] = false;
  });
  builder.addMatcher(isAnyOf(fetchLeadersAsync.rejected), (state, action) => {
    state.loadingKeys[serializeLoadingKey(action, 'rejected')] = false;
  });
});
