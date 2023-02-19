import { AbiItem } from 'web3-utils';
import { FactoryInterface } from '../../escrow-interface.service';
import getWeb3 from '../../../utils/web3';
import { Contract } from 'web3-eth-contract';


export class Web3EscrowFactory implements FactoryInterface {
    contract: Contract;
    proxyProvider: null;

    constructor(abi: AbiItem[], address: string) {
        let web3 = getWeb3();
        this.contract = new web3.eth.Contract(abi, address);
        this.proxyProvider = null;
    }

    async getLastEscrowAddress(): Promise<any> {
        return await this.contract.methods.getLastEscrowAddress().call();
    }

    async createJob(trusted_handler?: any): Promise<any> {
        let accunts = await getWeb3().eth.getAccounts();
        let mainAccount = accunts[0];
        let createdEscrow = await this.contract.methods
            .createEscrow([mainAccount])
            .send({ from: mainAccount });

        return createdEscrow;
    }

    getTxOutcome(txHash: any): Promise<any> {
        throw new Error('Method not implemented.');
    }

}