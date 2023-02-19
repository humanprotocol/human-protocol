import { EscrowInterface, SetupPayload } from "src/components/escrow-interface.service";
import getWeb3 from "src/utils/web3";
import { Contract } from "web3-eth-contract";
import { AbiItem } from 'web3-utils';
import HMTokenABI from '@human-protocol/core/abis/HMToken.json';
import { HMT_ADDRESS } from "src/constants/constants";


export class Web3EscrowContract implements EscrowInterface{
    contract:  Contract;
    proxyProvider: null;

    constructor(abi: AbiItem[], address: string) {
        let web3 = getWeb3();
        this.contract = new web3.eth.Contract(abi, address);;
        this.proxyProvider = null;
    }

    async getStatus(): Promise<any> {
        return await this.contract.methods.status().call();
    }

    async getBalance(): Promise<any> {
        let amount = await this.contract.methods.getBalance().call();
        let web3 = getWeb3();

        return web3.utils.fromWei(amount, 'ether')
    }

    async getManifest(): Promise<any> {
        return await this.contract.methods.getManifest().call();
    }

    async getFinalResults(): Promise<any> {
        return await this.contract.methods.finalResultsUrl().call();
    }

    async getOracles(): Promise<any> {
        throw new Error("Method not implemented.");
    }

    async fundEscrow(amount: any): Promise<any> {
        let web3 = getWeb3();
        let accounts = await web3.eth.getAccounts();
        const tokenContract = new web3.eth.Contract(HMTokenABI as [], HMT_ADDRESS);
        await tokenContract.methods
            .transfer(this.contract.options.address, web3.utils.toWei(amount.to_string(), 'ether'))
            .send({from: accounts[0]});
    }

    async setupEscrow(data: SetupPayload): Promise<any> {
        let web3 = getWeb3();
        let accounts = await web3.eth.getAccounts();
        await this.contract.methods.setup(
            data.reputation_oracle,
            data.recording_oracle,
            data.reputation_oracle_stake,
            data.recording_oracle_stake,
            data.url,
            data.hash
          ).send({from: accounts[0]})
    }

    async getRecordingOracle(): Promise<any> {
        return await this.contract.methods.recordingOracle().call();
    }

    async getRecordingOracleStake(): Promise<any> {
        return await this.contract.methods.recordingOracleStake().call();
    }

    async getReputationOracle(): Promise<any> {
        return await this.contract.methods.reputationOracle().call();
    }

    async getReputationOracleStake(): Promise<any> {
        return await this.contract.methods.reputationOracleStake().call();
    }

}