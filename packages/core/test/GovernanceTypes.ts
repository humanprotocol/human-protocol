// governance types.ts

export interface IWormholeSignature {
  r: string;
  s: string;
  v: number;
  guardianIndex: number;
}

export interface IWormholeVM {
  version: number;
  timestamp: number;
  nonce: number;
  emitterChainId: number;
  emitterAddress: string;
  sequence: number;
  consistencyLevel: number;
  payload: string;
  guardianSetIndex: number;
  signatures: IWormholeSignature[];
  hash: string;
}

export interface SignatureComponents {
  v: number;
  r: string;
  s: string;
}
