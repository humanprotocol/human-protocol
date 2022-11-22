import { configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';

import escrow from './escrow/reducer';
import token from './token/reducer';

const store = configureStore({
  reducer: {
    escrow,
    token,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ thunk: true }),
});

export default store;

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
