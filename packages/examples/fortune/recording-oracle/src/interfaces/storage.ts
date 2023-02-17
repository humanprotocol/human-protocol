export interface IStorage {
  [escrowAddress: string]: IEscrowStorage;
}

export interface IEscrowStorage {
  fortunesRequested: number;
  chainId: number;
  fortunes: IWorkerFortuneStorage;
}

export interface IWorkerFortuneStorage {
  [workerAddress: string]: IFortuneStorage[];
}

export interface IFortuneStorage {
  fortune: string;
  score: boolean;
}
