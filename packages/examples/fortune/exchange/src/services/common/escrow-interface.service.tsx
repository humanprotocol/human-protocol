import { SmartContract } from '@multiversx/sdk-core/out/smartcontracts';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers/out';
import { Contract } from 'web3-eth-contract';

/**
 * Interface for the escrow contract designed to be implemented by any
 * blockchain provider
 */
export interface EscrowInterface {
    contract: SmartContract | Contract;
    networkProvider: ProxyNetworkProvider | null;  // This is only necessary for the mx provider

    /**
     * Get the status of the escrow, which can be one of the following:
     * [Launched, Pending, Partial, Paid, Complete, Cancelled]
     * @returns {Promise<string>}
     */
    getStatus(): Promise<string>;

    /**
     * Get the balance of the escrow as a string in either ether or mx tokens
     * @returns {Promise<string>}
    */
    getBalance(): Promise<string>;

    /**
     * Get the manifest of the escrow as an url
     * @returns {Promise<string>}
     */
    getManifest(): Promise<string>;
}