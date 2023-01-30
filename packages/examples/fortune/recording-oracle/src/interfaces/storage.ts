export interface IStorage {
    [escrowAddress: string]: IEscrowStorage
}

export interface IEscrowStorage {
    fortunesRequested: Number,
    chainId: Number
    fortunes: IWorkerFortuneStorage
}

export interface IWorkerFortuneStorage {
    [workerAddress: string]: IFortuneStorage
}

export interface IFortuneStorage {
    fortune: string,
    score: boolean
}