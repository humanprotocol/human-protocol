import { ChainId } from "../constants/networks.js";
import { IFortuneStorage } from "./storage.js";

export interface IFortuneRequest {
    fortune: string,
    workerAddress: string,
    escrowAddress: string
    chainId: ChainId,
}

export interface IFortuneResults {
    escrowAddress: string,
    chainId: Number,
    fortunes: {
        [workerAddress: string]: IFortuneStorage
    }
}

export interface IRecordingOracleRequest {
    [escrowAddress: string]: {
        chainId: Number
        fortunes: {
            [workerAddress: string]: {
                fortune: string,
                score: boolean
            }
        }
    }   
}
