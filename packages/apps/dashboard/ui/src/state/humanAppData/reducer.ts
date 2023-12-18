import { ChainId } from '@human-protocol/sdk';

import { createAction, createReducer } from '@reduxjs/toolkit';

type HumanAppDataState = {
  loadingKeys: Record<string, boolean>;
  chainId: ChainId;
  days: number;
};

const initialState: HumanAppDataState = {
  loadingKeys: {},
  chainId: ChainId.ALL,
  days: 30,
};

export const setChainId = createAction<ChainId>('humanAppData/setChainId');

export const setDays = createAction<number>('humanAppData/setDays');

export default createReducer(initialState, (builder) => {
  builder.addCase(setChainId, (state, action) => {
    state.chainId = action.payload;
  });
  builder.addCase(setDays, (state, action) => {
    state.days = action.payload;
  });
});
