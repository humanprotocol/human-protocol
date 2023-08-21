export interface NetworkMapDto {
  [key: string]: {
    chainId: number;
    rpcUrl: string;
  };
}
