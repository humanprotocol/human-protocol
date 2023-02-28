import {
  AbiRegistry,
  Account,
  Address,
  AddressValue,
  Field,
  Interaction,
  ResultsParser,
  SmartContract,
  SmartContractAbi,
  StringValue,
  Struct,
  Tuple,
  TupleType,
  TypedOutcomeBundle,
  U64Value,
  VariadicType,
  VariadicValue,
} from '@multiversx/sdk-core/out';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers/out';
import { AddressFortune, EscrowContract } from './escrow.interface';

import escrowAbi from '../abi/escrow.abi.json';
import { UserSigner } from '@multiversx/sdk-wallet/out';
import * as dotenv from 'dotenv';
dotenv.config();

const abiRegistry = AbiRegistry.create(escrowAbi);
const abi = new SmartContractAbi(abiRegistry);
const proxyNetwork =
  process.env.MX_PROXY_NETWORK || 'https://devnet-gateway.multiversx.com';

const gasLimit = process.env.MX_GAS_LIMIT || 6000000;

export type Payment = [Address, number];

export class MxService implements EscrowContract {
  contract: SmartContract;
  networkProvider: ProxyNetworkProvider;
  serviceIdentity: UserSigner;

  constructor(escrowAddress: Address, serviceIdentity: UserSigner) {
    this.contract = new SmartContract({
      address: escrowAddress,
      abi,
    });
    this.networkProvider = new ProxyNetworkProvider(proxyNetwork);
    this.serviceIdentity = serviceIdentity;
  }

  async getBalance(): Promise<number> {
    const interaction = this.contract.methods.getBalance();
    const response = await this.performQuery(interaction);
    const firstValue = response.firstValue?.valueOf();

    return Number(firstValue);
  }

  filterAddressesToReward(addressFortunesEntries: AddressFortune[]): Address[] {
    const filteredResults: AddressFortune[] = [];
    const tmpHashMap: { [fortune: string]: boolean } = {};

    addressFortunesEntries.forEach((fortuneEntry) => {
      const { fortune } = fortuneEntry;
      if (tmpHashMap[fortune]) {
        return;
      }

      tmpHashMap[fortune] = true;
      filteredResults.push(fortuneEntry);
    });

    return filteredResults
      .map((fortune: { worker: string }) => fortune.worker)
      .map(Address.fromString);
  }

  private toVariadicType(data: Payment[]): VariadicValue {
    const tupleType = new TupleType();
    const variadicType = new VariadicType(tupleType);
    const items: Tuple[] = [];
    for (const payment of data) {
      const [workerAddress, reward] = payment;
      const tuple = new Tuple(tupleType, [
        new Field(new AddressValue(workerAddress)),
        new Field(new U64Value(reward)),
      ]);

      items.push(tuple);
    }

    return new VariadicValue(variadicType, items);
  }

  private async updateAccountData(): Promise<number> {
    const walletAddress = this.serviceIdentity.getAddress();
    const account = new Account(walletAddress);
    const accountOnNetwork = await this.networkProvider.getAccount(
      walletAddress
    );
    account.update(accountOnNetwork);

    return account.nonce.valueOf();
  }

  async bulkPayOut(
    workerAddresses: Address[],
    rewards: number[],
    resultsUrl: string,
    resultHash: string
  ): Promise<unknown> {
    const payments: Payment[] = workerAddresses.map((workerAddress, index) => [
      workerAddress,
      rewards[index],
    ]);

    const variadicTypePayments = this.toVariadicType(payments);
    const urlHashPairType = abiRegistry.getStruct('UrlHashPair');
    const interaction = this.contract.methodsExplicit.bulkPayOut([
      variadicTypePayments,
      new Struct(urlHashPairType, [
        new Field(new StringValue(resultsUrl)),
        new Field(new StringValue(resultHash)),
      ]),
    ]);

    const nonce = await this.updateAccountData();
    const networkConfig = await this.networkProvider.getNetworkConfig();

    const tx = interaction
      .withChainID(networkConfig.ChainID)
      .withGasLimit(Number(gasLimit))
      .withNonce(nonce)
      .buildTransaction();

    await this.serviceIdentity.sign(tx);

    const txHash = await this.networkProvider.sendTransaction(tx);

    return txHash;
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
