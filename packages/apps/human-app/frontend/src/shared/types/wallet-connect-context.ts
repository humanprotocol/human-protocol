import { type CommonWalletConnectContext } from '../interfaces/common-wallet-connect-context.interface';
import {
  type ConnectedAccount,
  type DisconnectedAccount,
} from '../interfaces/wallet-connect-account-state.interface';

export type WalletConnectContextConnectedAccount = CommonWalletConnectContext &
  ConnectedAccount;

export type WalletConnectContextDisconnectedAccount =
  CommonWalletConnectContext & DisconnectedAccount;
