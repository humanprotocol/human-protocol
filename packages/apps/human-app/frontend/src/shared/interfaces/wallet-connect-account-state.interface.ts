export interface ConnectedAccount {
  isConnected: true;
  chainId: number;
  address: string;
  signMessage: (message: string) => Promise<string | undefined>;
}

export interface DisconnectedAccount {
  isConnected: false;
  chainId?: never;
  address?: never;
  signMessage?: (message: string) => Promise<string | undefined>;
}
