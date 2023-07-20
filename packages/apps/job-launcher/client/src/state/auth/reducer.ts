import { createSlice } from '@reduxjs/toolkit';
import { AuthState } from './types';

const initialState: AuthState = {
  isAuthed: false,
  user: null,
  token: null,
  refreshToken: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
});

export default authSlice.reducer;
