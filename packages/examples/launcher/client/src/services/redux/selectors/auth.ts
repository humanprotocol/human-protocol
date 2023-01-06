import { createDraftSafeSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectSelf = (state: RootState) => state;

export const makeIsTokenAuthenticated = createDraftSafeSelector(
  selectSelf,
  (state) => state.auth?.isAuth
);

export const makeIsMetaMaskConnected = createDraftSafeSelector(
  selectSelf,
  (state) => state.auth?.isMetaMaskConnected
);

export const makeIsAuth = createDraftSafeSelector(
  [makeIsTokenAuthenticated, makeIsMetaMaskConnected],
  (login, metamask) => login && metamask
);
