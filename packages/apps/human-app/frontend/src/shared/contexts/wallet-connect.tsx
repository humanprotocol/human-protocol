import { createContext } from 'react';
import {
  type WalletConnectContextConnectedAccount,
  type WalletConnectContextDisconnectedAccount,
} from '../types/wallet-connect-context';

export const WalletConnectContext = createContext<
  | WalletConnectContextConnectedAccount
  | WalletConnectContextDisconnectedAccount
  | null
>(null);
