import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IUser } from '../../types';

const initialState: IUser = {
  email: null,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<IUser>) => {
      state.email = action.payload.email;
    },
  },
});

// Actions
export const { setUser } = userSlice.actions;

// Reducer
const userSReducer = userSlice.reducer;
export default userSReducer;
