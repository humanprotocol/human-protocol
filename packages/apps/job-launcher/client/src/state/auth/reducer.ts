import {
  createAction,
  createAsyncThunk,
  createReducer,
} from '@reduxjs/toolkit';
import { LOCAL_STORAGE_KEYS } from '../../constants';
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
    const { accessToken, refreshToken } = action.payload;

    localStorage.setItem(LOCAL_STORAGE_KEYS.accessToken, accessToken);
    localStorage.setItem(LOCAL_STORAGE_KEYS.refreshToken, accessToken);

    state.isAuthed = true;
    const { email, status } = getJwtPayload(accessToken);
    state.user = { email: email, status: status };
    state.accessToken = accessToken;
    state.refreshToken = refreshToken;
  });
  builder.addCase(signOut, (state, action) => {
    state.isAuthed = false;
    state.accessToken = undefined;
    state.refreshToken = undefined;

    localStorage.removeItem(LOCAL_STORAGE_KEYS.accessToken);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.refreshToken);
  });
  builder.addCase(fetchUserBalanceAsync.fulfilled, (state, action) => {
    if (state.user) {
      state.user = { ...state.user, balance: action.payload };
    }
  });
});
