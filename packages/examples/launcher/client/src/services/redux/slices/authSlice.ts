import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IAuth } from '../api/types';

const initialState: IAuth = {
  isAuth: false,
  isMetaMaskConnected: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signOut: () => {
      localStorage.clear();
      return initialState;
    },
    signIn: (state) => {
      state.isAuth = true;
    },
    setAuth: (state, action: PayloadAction<IAuth>) => {
      state.isAuth = action.payload.isAuth;
    },
    setMetaMaskConnection: (state, action: PayloadAction<IAuth>) => {
      state.isMetaMaskConnected = action.payload.isMetaMaskConnected;
    },
  },
});

// Actions
export const { signIn, signOut, setAuth, setMetaMaskConnection } =
  authSlice.actions;

// Reducer
const authReducer = authSlice.reducer;
export default authReducer;
