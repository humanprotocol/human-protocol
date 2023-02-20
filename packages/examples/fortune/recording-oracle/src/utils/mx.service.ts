import {
  AbiRegistry,
  Account,
  Address,
  Interaction,
  ResultsParser,
  SmartContract,
  SmartContractAbi,
  TypedOutcomeBundle,
} from '@multiversx/sdk-core/out';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers/out';
import { EscrowContract } from './contract.interface';
import escrowAbi from '../abi/escrow.abi.json';
import { UserSigner } from '@multiversx/sdk-wallet/out';

const abiRegistry = AbiRegistry.create(escrowAbi);
const abi = new SmartContractAbi(abiRegistry);
const proxyNetwork =
  process.env.MX_PROXY_NETWORK || 'https://devnet-gateway.multiversx.com';

const gasLimit = process.env.MX_GAS_LIMIT || 6000000;

type Oracle = {
  address: Address;
  stake: number;
};

type QueryResult = {
  recording: Oracle;
  reputation: Oracle;
};

export class MxService implements EscrowContract {
  contract: SmartContract;
  networkProvider: ProxyNetworkProvider;
  signer: UserSigner;

  constructor(escrowAddress: Address, signer: UserSigner) {
    this.contract = new SmartContract({
      address: escrowAddress,
      abi,
    });
    this.networkProvider = new ProxyNetworkProvider(proxyNetwork);
    this.signer = signer;
  }

  private async getOracles(): Promise<QueryResult> {
    const interaction = this.contract.methods.getOracles();
    const { firstValue } = await this.performQuery(interaction);

    return firstValue?.valueOf();
  }

  async getRecordingOracleAddress(): Promise<string> {
    const oracles = await this.getOracles();

    return oracles?.recording?.address?.toString();
  }

  async getEscrowStatus(): Promise<string> {
    const interaction = this.contract.methods.getStatus();
    try {
      const { firstValue } = await this.performQuery(interaction);

      return firstValue?.valueOf()?.name;
    } catch (err) {
      return '';
    }
  }

  async getEscrowManifestUrl(): Promise<string> {
    const interaction = this.contract.methods.getManifest();
    const { firstValue } = await this.performQuery(interaction);

    return firstValue?.valueOf()?.url.toString();
  }

  async storeResults(resultsUrl: string, resultHash: string): Promise<string> {
    const nonce = await this.updateAccountData();
    const networkConfig = await this.networkProvider.getNetworkConfig();

    const tx = this.contract.methods
      .storeResults([resultsUrl, resultHash])
      .withChainID(networkConfig.ChainID)
      .withGasLimit(Number(gasLimit))
      .withNonce(nonce)
      .buildTransaction();

    await this.signer.sign(tx);

    const txHash = await this.networkProvider.sendTransaction(tx);

    return txHash;
  }

  private async updateAccountData(): Promise<number> {
    const walletAddress = this.signer.getAddress();
    const account = new Account(walletAddress);
    const accountOnNetwork = await this.networkProvider.getAccount(
      walletAddress
    );
    account.update(accountOnNetwork);

    return account.nonce.valueOf();
  }

  private async performQuery(
    interaction: Interaction
  ): Promise<TypedOutcomeBundle> {
    const resultParser = new ResultsParser();
    const queryResponse = await this.networkProvider.queryContract(
      interaction.check().buildQuery()
    );

    return resultParser.parseQueryResponse(
      queryResponse,
      interaction.getEndpoint()
    );
  }
}
