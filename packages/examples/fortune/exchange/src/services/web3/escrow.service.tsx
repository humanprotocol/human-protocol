import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers/out";
import { EscrowInterface } from "../common/escrow-interface.service";
import { Contract } from 'web3-eth-contract';
import EscrowABI from '@human-protocol/core/abis/Escrow.json';

import getWeb3 from "src/utils/web3";

const statusesMap = ['Launched', 'Pending', 'Partial', 'Paid', 'Complete', 'Cancelled'];


export class Web3EscrowContract implements EscrowInterface {
    contract: Contract;
    networkProvider: ProxyNetworkProvider | null;

    constructor(address: string) {
        let web3 = getWeb3();
        this.contract = new web3.eth.Contract(EscrowABI as [], address);;
        this.networkProvider = null;
    }

    async getStatus(): Promise<string> {
        let escrowSt = await this.contract.methods.status().call();

        return statusesMap[escrowSt];
    }

    async getBalance(): Promise<string> {
        let web3 = getWeb3();
        let contractBalance = await this.contract.methods.getBalance().call();

        return web3.utils.fromWei(contractBalance, 'ether')
    }

    async getManifest(): Promise<string> {
        return await this.contract.methods.manifestUrl().call();
    }
}