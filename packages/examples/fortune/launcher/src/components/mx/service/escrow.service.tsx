import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers';
import {
  AbiRegistry,
  Address,
  Interaction,
  ResultsParser,
  SmartContract,
  SmartContractAbi,
  TokenPayment,
  Transaction,
  TypedOutcomeBundle
} from '@multiversx/sdk-core/';
import BigNumber from 'bignumber.js';
import escrowAbi from './abi/escrow.abi.json';
import { gasLimit, HMT_DECIMALS, HMT_TOKEN, proxyNetwork } from '../../../constants/constants';
import { EscrowInterface, SetupPayload } from 'src/components/escrow-interface.service';

const abiRegistry = AbiRegistry.create(escrowAbi);
const abi = new SmartContractAbi(abiRegistry);
const networkProxy: string =
  proxyNetwork || 'https://devnet-gateway.elrond.com';

type UrlHashPair = {
  url: string;
  hash: string;
};


export class EscrowService implements EscrowInterface{
  contract: SmartContract;
  proxyProvider: ProxyNetworkProvider;

  constructor(address: string) {
    const contractAdress = new Address(address);
    this.contract = new SmartContract({
      address: contractAdress,
      abi
    });
    this.proxyProvider = new ProxyNetworkProvider(networkProxy);
  }

  getRecordingOracle(): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getRecordingOracleStake(): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getReputationOracle(): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getReputationOracleStake(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async getStatus(): Promise<string> {
    const interaction = this.contract.methods.getStatus();
    try {
      const { firstValue } = await this.performQuery(interaction);

      return firstValue?.valueOf()?.name;
    } catch (err) {
      return '';
    }
  }

  async getBalance(): Promise<number> {
    const interaction = this.contract.methods.getBalance();
    const response = await this.performQuery(interaction);
    const firstValue = response.firstValue?.valueOf();

    return parseInt(firstValue);
  }

  async getManifest(): Promise<UrlHashPair> {
    const interaction = this.contract.methods.getManifest();
    const { firstValue } = await this.performQuery(interaction);

    return {
      url: firstValue?.valueOf()?.url.toString(),
      hash: firstValue?.valueOf()?.hash.toString()
    };
  }

  async getFinalResults(): Promise<UrlHashPair> {
    const interaction = this.contract.methods.getFinalResults();
    const { firstValue } = await this.performQuery(interaction);

    return {
      url: firstValue?.valueOf()?.fields[0].name,
      hash: firstValue?.valueOf()?.fields[1].name
    };
  }

  async getOracles(): Promise<any> {
    const interaction = this.contract.methods.getOracles();
    const { firstValue } = await this.performQuery(interaction);

    return firstValue?.valueOf();
  }

  async fundEscrow(amount: number): Promise<{
    success: boolean;
    error: string;
    sessionId: string | null;
  }> {
    const networkConfig = await this.proxyProvider.getNetworkConfig();
    const tx = this.contract.methods
      .deposit([])
      .withSingleESDTTransfer(
        TokenPayment.fungibleFromAmount(
          HMT_TOKEN,
          new BigNumber(amount),
          HMT_DECIMALS
        )
      )
      .withGasLimit(gasLimit)
      .withChainID(networkConfig.ChainID)
      .buildTransaction();

    const txDisplay = {
      processingMessage: 'Funding escrow',
      errorMessage: 'Funding error',
      successMessage: 'Escrow funded'
    };

    return await this.performCall(tx, txDisplay);
  }

  async setupEscrow(data: SetupPayload): Promise<any> {
    const networkConfig = await this.proxyProvider.getNetworkConfig();
    const tx = this.contract.methods
      .setup([
        data.recording_oracle,
        data.reputation_oracle,
        new BigNumber(data.recording_oracle_stake),
        new BigNumber(data.reputation_oracle_stake),
        data.url,
        data.hash
      ])
      .withGasLimit(gasLimit)
      .withChainID(networkConfig.ChainID)
      .buildTransaction();

    const txDisplay = {
      processingMessage: 'Setup escrow',
      errorMessage: 'Setup error',
      successMessage: 'Escrow setup complete'
    };

    return await this.performCall(tx, txDisplay);
  }

  private async performCall(
    tx: Transaction,
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
}