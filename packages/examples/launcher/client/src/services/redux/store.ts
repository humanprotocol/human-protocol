import { configureStore, combineReducers } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import {
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  persistReducer,
} from 'redux-persist';
import { authApi } from './api/authApi';
import { userApi } from './api/userApi';
import userReducer from './slices/userSlice';
import authReducer from './slices/authSlice';
import jobsReducer from './slices/jobSlice';
import { jobApi } from './api/jobApi';
// import logger from 'redux-logger';

const appReducer = combineReducers({
  [authApi.reducerPath]: authApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
  [jobApi.reducerPath]: jobApi.reducer,
  auth: authReducer,
  user: userReducer,
  job: jobsReducer,
});

const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  timeout: 1,
  blacklist: [],
};

export type RootReducer = ReturnType<typeof appReducer>;

const persistedReducer = persistReducer(persistConfig, appReducer);

export const store = configureStore({
  reducer: persistedReducer,
  devTools: process.env.NODE_ENV === 'development',
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat([
      jobApi.middleware,
      authApi.middleware,
      userApi.middleware,
      // logger,
    ]),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
