import { createSlice } from '@reduxjs/toolkit';
import { LOCAL_STORAGE_KEYS } from '../../constants';
import { getJwtPayload } from '../../utils/jwt';
import { AuthState } from './types';

const initialState: AuthState = {
  isAuthed: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signIn: (state, action) => {
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
        accessTokenExpiresAt
      );
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.refreshTokenExpiresAt,
        refreshTokenExpiresAt
      );

      state.isAuthed = true;
      state.email = getJwtPayload(accessToken);
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.accessTokenExpiresAt = accessTokenExpiresAt;
      state.refreshTokenExpiresAt = refreshTokenExpiresAt;
    },
    signOut: (state) => {
      state.isAuthed = false;
      state.email = undefined;
      state.accessToken = undefined;
      state.accessTokenExpiresAt = undefined;
      state.refreshToken = undefined;
      state.refreshTokenExpiresAt = undefined;

      localStorage.removeItem(LOCAL_STORAGE_KEYS.accessToken);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.refreshToken);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.accessTokenExpiresAt);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.refreshTokenExpiresAt);
    },
  },
});

export const { signIn, signOut } = authSlice.actions;

export default authSlice.reducer;
