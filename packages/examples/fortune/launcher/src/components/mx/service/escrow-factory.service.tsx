import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers/out';
import {
  AbiRegistry,
  Address,
  AddressValue,
  IPlainTransactionObject,
  Interaction,
  ResultsParser,
  SmartContract,
  SmartContractAbi,
  TypedOutcomeBundle,
} from '@multiversx/sdk-core';
import escrowFactoryAbi from './abi/escrow-factory.abi.json';
import { proxyNetwork, ESCROW_FACTORY_MX_ADDRESS, gasLimit } from '../../../constants/constants';
import { FactoryInterface } from '../../escrow-interface.service'

const abiRegistry = AbiRegistry.create(escrowFactoryAbi);
const abi = new SmartContractAbi(abiRegistry);

export default class EscrowFactory implements FactoryInterface {
  contract: SmartContract;
  proxyProvider: ProxyNetworkProvider;
  blockchainType: string;

  constructor() {
    const scAddress = new Address(ESCROW_FACTORY_MX_ADDRESS);
    this.contract = new SmartContract({
      address: scAddress,
      abi
    });
    this.proxyProvider = new ProxyNetworkProvider(proxyNetwork);
    this.blockchainType = 'mx';
  }

  async getLastEscrowAddress(address: Address): Promise<any> {
    const interaction = this.contract.methods.getLastJobAddress([address]);
    let res = await this.performQuery(interaction);

    return res.firstValue?.valueOf().bech32();
  }

  async createJob(trusted_handler: Address) {
    const networkConfig = await this.proxyProvider.getNetworkConfig();
    const tx = this.contract.methodsExplicit
      .createJob([
        new AddressValue(trusted_handler)
      ])
      .withGasLimit(gasLimit)
      .withChainID(networkConfig.ChainID)
      .buildTransaction()

    const txDisplay = {
      processingMessage: 'Creating new escrow contract',
      errorMessage: 'An error has occurred during escrow creation',
      successMessage: 'New escrow created!'
    };

    return await this.performCall(tx.toPlainObject(), txDisplay);
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

  private async performQuery(
    interaction: Interaction
  ): Promise<TypedOutcomeBundle> {
    const resultParser = new ResultsParser();
    const queryResponse = await this.proxyProvider.queryContract(
      interaction.check().buildQuery()
    );

    return resultParser.parseQueryResponse(
      queryResponse,
      interaction.getEndpoint()
    );
  }

  private async performCall(
    tx: IPlainTransactionObject,
    txDisplay: object
  ): Promise<{
    success: boolean;
    error: string;
    sessionId: string | null;
  }> {
    await refreshAccount();
    const networkConfig = await this.proxyProvider.getNetworkConfig();

    try {
      const { sessionId, error } = await sendTransactions({
        transactions: tx,
        transactionsDisplayInfo: txDisplay,
        redirectAfterSign: false,
        minGasLimit: networkConfig.MinGasLimit
      });

      return { success: error !== undefined, error: error ?? '', sessionId };
    } catch (error: any) {
      console.log(`Escrow Call Error: ${error}`);
      return { success: false, error: error.message, sessionId: null };
    }
  }
}