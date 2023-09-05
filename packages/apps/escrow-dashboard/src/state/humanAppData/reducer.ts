import HMTokenABI from '@human-protocol/core/abis/HMToken.json';
import { ChainId, StatisticsClient, NETWORKS } from '@human-protocol/sdk';
import {
  EscrowStatistics,
  HMTStatistics,
  PaymentStatistics,
  WorkerStatistics,
} from '@human-protocol/sdk/dist/graphql';
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
import BigNumberJS from 'bignumber.js';
import { Contract, providers, utils } from 'ethers';
import stringify from 'fast-json-stable-stringify';
import {
  RPC_URLS,
  V2_SUPPORTED_CHAIN_IDS,
  HM_TOKEN_DECIMALS,
} from 'src/constants';
import { AppState } from 'src/state';

type HumanAppDataType = {
  [chainId in ChainId]?: {
    escrowStatistics: EscrowStatistics;
    workerStatistics: WorkerStatistics;
    paymentStatistics: PaymentStatistics;
    hmtStatistics: HMTStatistics;
    hmtTotalSupply: string;
  };
};

type HumanAppDataState = {
  loadingKeys: Record<string, boolean>;
  chainId: ChainId;
  days: number;

  data: HumanAppDataType;
  dataLoaded: boolean;
};

const initialState: HumanAppDataState = {
  loadingKeys: {},
  chainId: ChainId.POLYGON_MUMBAI,
  days: 30,
  data: {},
  dataLoaded: false,
};

const fetchTotalSupply = async (chainId: ChainId) => {
  const rpcUrl = RPC_URLS[chainId]!;
  const hmtAddress = NETWORKS[chainId]?.hmtAddress!;
  const provider = new providers.JsonRpcProvider(rpcUrl);
  const contract = new Contract(hmtAddress, HMTokenABI, provider);
  const totalSupplyBN = await contract.totalSupply();
  return new BigNumberJS(
    utils.formatUnits(totalSupplyBN, HM_TOKEN_DECIMALS)
  ).toJSON();
};

const fetchStatistics = async (chainId: ChainId) => {
  const network = NETWORKS[chainId];
  const client = new StatisticsClient(network!);
  const [escrowStatistics, workerStatistics, paymentStatistics, hmtStatistics] =
    await Promise.all([
      client.getEscrowStatistics(),
      client.getWorkerStatistics(),
      client.getPaymentStatistics(),
      client.getHMTStatistics(),
    ]);

  const hmtTotalSupply = await fetchTotalSupply(chainId);

  return {
    escrowStatistics,
    workerStatistics,
    paymentStatistics,
    hmtStatistics,
    hmtTotalSupply,
  };
};

export const fetchHumanAppData = createAsyncThunk<
  HumanAppDataType,
  void,
  { state: AppState }
>('humanAppData/fetchHumanAppData', async () => {
  const data: HumanAppDataType = {};

  await Promise.all(
    V2_SUPPORTED_CHAIN_IDS.map(async (chainId) => {
      const statistics = await fetchStatistics(chainId);

      data[chainId] = statistics;
    })
  );

  return data;
});

export const setChainId = createAction<ChainId>('humanAppData/setChainId');

export const setDays = createAction<number>('humanAppData/setDays');

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
  builder.addCase(setDays, (state, action) => {
    state.days = action.payload;
  });
  builder.addCase(fetchHumanAppData.fulfilled, (state, action) => {
    state.data = action.payload;
    state.dataLoaded = true;
  });

  builder.addMatcher(isAnyOf(fetchHumanAppData.pending), (state, action) => {
    state.loadingKeys[serializeLoadingKey(action, 'pending')] = true;
  });
  builder.addMatcher(isAnyOf(fetchHumanAppData.fulfilled), (state, action) => {
    state.loadingKeys[serializeLoadingKey(action, 'fulfilled')] = false;
  });
  builder.addMatcher(isAnyOf(fetchHumanAppData.rejected), (state, action) => {
    state.loadingKeys[serializeLoadingKey(action, 'rejected')] = false;
  });
});
