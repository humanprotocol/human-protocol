import { SmartContract } from "@multiversx/sdk-core/out";
import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers/out";
import { Contract } from 'web3-eth-contract';

export type SetupPayload = {
    reputation_oracle: string;
    recording_oracle: string;
    reputation_oracle_stake: number;
    recording_oracle_stake: number;
    url: string;
    hash: string;
};


export interface FactoryInterface {
    contract: SmartContract | Contract;
    proxyProvider: ProxyNetworkProvider | null;
    blockchainType: string;

    createJob(trusted_handler?: any): Promise<any>;
    getTxOutcome(txHash: any): Promise<any>;
    getLastEscrowAddress(address?: any): Promise<any>;
}

export interface EscrowInterface {
    contract: SmartContract | Contract;
    proxyProvider: ProxyNetworkProvider | null;

    getStatus(): Promise<any>;
    getBalance(): Promise<any>;
    getManifest(): Promise<any>;
    getFinalResults(): Promise<any>;
    getOracles(): Promise<any>;
    fundEscrow(amount: number): Promise<any>;
    getRecordingOracle(): Promise<any>;
    getRecordingOracleStake(): Promise<any>;
    getReputationOracle(): Promise<any>;
    getReputationOracleStake(): Promise<any>;
    setupEscrow(data: SetupPayload): Promise<any>;
}