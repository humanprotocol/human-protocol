import HMTokenABI from '@human-protocol/core/abis/HMToken.json';
import { createAsyncThunk, createReducer, isAnyOf } from '@reduxjs/toolkit';
import {
  UnknownAsyncThunkFulfilledAction,
  UnknownAsyncThunkPendingAction,
  UnknownAsyncThunkRejectedAction,
} from '@reduxjs/toolkit/dist/matchers';
import BigNumberJS from 'bignumber.js';
import { Contract, ethers, providers } from 'ethers';
import stringify from 'fast-json-stable-stringify';

import { AppState } from '..';
import { TokenStats } from './types';

import {
  ChainId,
  SUPPORTED_CHAIN_IDS,
  ESCROW_NETWORKS,
  HM_TOKEN_DECIMALS,
} from 'src/constants';
import { RAW_TOKEN_STATS_QUERY } from 'src/queries';
import { gqlFetch } from 'src/utils/gqlFetch';

type TokenStatsType = { [chainId in ChainId]?: TokenStats };

type TokenState = {
  loadingKeys: Record<string, boolean>;
  stats: TokenStatsType;
  statsLoaded: boolean;
};

const initialState: TokenState = {
  loadingKeys: {},
  stats: {},
  statsLoaded: false,
};

export const fetchTokenStatsAsync = createAsyncThunk<
  TokenStatsType,
  void,
  { state: AppState }
>('token/fetchTokenStatsAsync', async () => {
  let tokenStats: TokenStatsType = {};
  await Promise.all(
    SUPPORTED_CHAIN_IDS.map(async (chainId) => {
      if (chainId === ChainId.RINKEBY) {
        tokenStats[chainId] = {
          totalApprovalEventCount: 0,
          totalTransferEventCount: 0,
          totalValueTransfered: 0,
          holders: 0,
          totalSupply: '0',
        };
        return;
      }
      const stats = await gqlFetch(
        ESCROW_NETWORKS[chainId]?.subgraphUrl!,
        RAW_TOKEN_STATS_QUERY
      )
        .then((res) => res.json())
        .then((json) => {
          const {
            totalApprovalEventCount,
            totalTransferEventCount,
            totalValueTransfered,
            holders,
          } = json.data.hmtokenStatistics;
          return {
            totalApprovalEventCount: Number(totalApprovalEventCount),
            totalTransferEventCount: Number(totalTransferEventCount),
            totalValueTransfered: Number(totalValueTransfered),
            holders: Number(holders),
            totalSupply: '0',
          };
        })
        .catch((err) => ({
          totalApprovalEventCount: 0,
          totalTransferEventCount: 0,
          totalValueTransfered: 0,
          holders: 0,
          totalSupply: '0',
        }));

      const rpcUrl = ESCROW_NETWORKS[chainId]?.rpcUrl!;
      const hmtAddress = ESCROW_NETWORKS[chainId]?.hmtAddress!;
      const provider = new providers.JsonRpcProvider(rpcUrl);
      const contract = new Contract(hmtAddress, HMTokenABI, provider);
      const totalSupplyBN = await contract.totalSupply();
      stats.totalSupply = new BigNumberJS(
        ethers.utils.formatUnits(totalSupplyBN, HM_TOKEN_DECIMALS)
      ).toJSON();
      tokenStats[chainId] = stats;
    })
  );

  return tokenStats;
});

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
  builder.addCase(fetchTokenStatsAsync.fulfilled, (state, action) => {
    state.stats = action.payload;
    state.statsLoaded = true;
  });

  builder.addMatcher(isAnyOf(fetchTokenStatsAsync.pending), (state, action) => {
    state.loadingKeys[serializeLoadingKey(action, 'pending')] = true;
  });
  builder.addMatcher(
    isAnyOf(fetchTokenStatsAsync.fulfilled),
    (state, action) => {
      state.loadingKeys[serializeLoadingKey(action, 'fulfilled')] = false;
    }
  );
  builder.addMatcher(
    isAnyOf(fetchTokenStatsAsync.rejected),
    (state, action) => {
      state.loadingKeys[serializeLoadingKey(action, 'rejected')] = false;
    }
  );
});
