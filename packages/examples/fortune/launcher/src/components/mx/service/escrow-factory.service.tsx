import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers/out';
import {
  AbiRegistry,
  Address,
  AddressValue,
  ContractFunction,
  ResultsParser,
  SmartContract,
  SmartContractAbi,
  TypedValue
} from '@multiversx/sdk-core';
import escrowFactoryAbi from './abi/escrow-factory.abi.json';
import { proxyNetwork, ESCROW_FACTORY_MX_ADDRESS, gasLimit } from '../../../constants/constants';
import { FactoryInterface } from '../../escrow-interface.service'

const abiRegistry = AbiRegistry.create(escrowFactoryAbi);
const abi = new SmartContractAbi(abiRegistry);

export default class EscrowFactory implements FactoryInterface {
  contract: SmartContract;
  proxyProvider: ProxyNetworkProvider;

  constructor() {
    const scAddress = new Address(ESCROW_FACTORY_MX_ADDRESS);
    this.contract = new SmartContract({
      address: scAddress,
      abi
    });
    this.proxyProvider = new ProxyNetworkProvider(proxyNetwork);
  }
  getLastEscrowAddress(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async createJob(trusted_handler: Address) {
    const txArgs: TypedValue[] = [];
    txArgs.push(new AddressValue(trusted_handler));
    const networkConfig = await this.proxyProvider.getNetworkConfig();
    const tx = this.contract.call({
      func: new ContractFunction('createJob'),
      args: txArgs,
      gasLimit: gasLimit,
      chainID: networkConfig.ChainID
    });

    await refreshAccount();

    const { sessionId, error } = await sendTransactions({
      transactions: tx,
      transactionsDisplayInfo: {
        processingMessage: 'Creating new escrow contract',
        errorMessage: 'An error has occurred during escrow creation',
        successMessage: 'New escrow created!'
      },
      redirectAfterSign: false,
      minGasLimit: networkConfig.MinGasLimit
    });

    return { success: error !== undefined, error: error ?? '', sessionId };
  }

  async getTxOutcome(txHash: string) {
    const resultsParser = new ResultsParser();
    const transactionOnNetwork = await this.proxyProvider.getTransaction(
      txHash
    );

    return resultsParser.parseOutcome(
      transactionOnNetwork,
      this.contract.getEndpoint('createJob')
    );
  }
}