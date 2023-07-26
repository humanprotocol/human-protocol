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
    const {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    } = action.payload;

    localStorage.setItem(LOCAL_STORAGE_KEYS.accessToken, accessToken);
    localStorage.setItem(LOCAL_STORAGE_KEYS.refreshToken, accessToken);
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.accessTokenExpiresAt,
      accessTokenExpiresAt.toString()
    );
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.refreshTokenExpiresAt,
      refreshTokenExpiresAt.toString()
    );

    state.isAuthed = true;
    state.user = { email: getJwtPayload(accessToken) };
    state.accessToken = accessToken;
    state.refreshToken = refreshToken;
    state.accessTokenExpiresAt = accessTokenExpiresAt;
    state.refreshTokenExpiresAt = refreshTokenExpiresAt;
  });
  builder.addCase(signOut, (state, action) => {
    state.isAuthed = false;
    state.accessToken = undefined;
    state.accessTokenExpiresAt = undefined;
    state.refreshToken = undefined;
    state.refreshTokenExpiresAt = undefined;

    localStorage.removeItem(LOCAL_STORAGE_KEYS.accessToken);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.refreshToken);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.accessTokenExpiresAt);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.refreshTokenExpiresAt);
  });
  builder.addCase(fetchUserBalanceAsync.fulfilled, (state, action) => {
    if (state.user) {
      state.user = { ...state.user, balance: action.payload };
    }
  });
});
