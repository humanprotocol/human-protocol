import { FactoryInterface } from '../../escrow-interface.service';
import getWeb3 from '../../../utils/web3';
import { Contract } from 'web3-eth-contract';
import factoryAbi from '@human-protocol/core/abis/EscrowFactory.json';
import { ESCROW_FACTORY_ADDRESS } from 'src/constants/constants';



export class Web3EscrowFactory implements FactoryInterface {
    contract: Contract;
    proxyProvider: null;
    blockchainType: string;

    constructor() {
        let web3 = getWeb3();
        this.contract = new web3.eth.Contract(factoryAbi as [], ESCROW_FACTORY_ADDRESS);
        this.proxyProvider = null;
        this.blockchainType = 'web3';
    }

    async getLastEscrowAddress(_address: any): Promise<any> {
        return await this.contract.methods.getLastEscrowAddress().call();
    }

    async createJob(_trusted_handler?: any): Promise<any> {
        let accounts = await getWeb3().eth.getAccounts();
        let mainAccount = accounts[0];
        let createdEscrow = await this.contract.methods
            .createEscrow([mainAccount])
            .send({ from: mainAccount });

        return createdEscrow.events.Launched.returnValues.escrow;
    }

    getTxOutcome(txHash: any): Promise<any> {
        throw new Error('Method not implemented.');
    }

}