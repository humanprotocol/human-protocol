import {
  createAction,
  createAsyncThunk,
  createReducer,
} from '@reduxjs/toolkit';
import { SignUpResponse } from '../../types';
import api from '../../utils/api';
import { getJwtPayload } from '../../utils/jwt';
import { AppState } from '../index';
import { AuthState, UserBalance } from './types';

const initialState: AuthState = {
  isAuthed: false,
};

export const fetchUserBalanceAsync = createAsyncThunk<
  UserBalance,
  void,
  { state: AppState }
>('auth/fetchUserBalanceAsync', async () => {
  const { data } = await api.get<UserBalance>(`/user/balance`);
  return data;
});

export const signIn = createAction<SignUpResponse>('auth/signIn');

export const signOut = createAction<void>('auth/signOut');

export default createReducer(initialState, (builder) => {
  builder.addCase(signIn, (state, action) => {
    const { accessToken } = action.payload;

    state.isAuthed = true;
    const { email, status } = getJwtPayload(accessToken);
    state.user = { email: email, status: status };
    state.accessToken = accessToken;
  });
  builder.addCase(signOut, (state) => {
    state.isAuthed = false;
    state.accessToken = undefined;
    state.refreshToken = undefined;
  });
  builder.addCase(fetchUserBalanceAsync.fulfilled, (state, action) => {
    if (state.user) {
      state.user = { ...state.user, balance: action.payload };
    }
  });
});
