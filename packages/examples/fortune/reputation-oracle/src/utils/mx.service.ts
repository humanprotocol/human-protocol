import {
  AbiRegistry,
  Address,
  AddressValue,
  Field,
  Interaction,
  ResultsParser,
  SmartContract,
  SmartContractAbi,
  Tuple,
  TupleType,
  TypedOutcomeBundle,
  U64Value,
  VariadicType,
  VariadicValue,
} from '@multiversx/sdk-core/out';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers/out';
import { EscrowContract } from './escrow.interface';

import escrowAbi from '../abi/escrow.abi.json';
import { UserSigner } from '@multiversx/sdk-wallet/out';

const abiRegistry = AbiRegistry.create(escrowAbi);
const abi = new SmartContractAbi(abiRegistry);
const proxyNetwork =
  process.env.MX_PROXY_NETWORK || 'https://devnet-gateway.multiversx.com';

const gasLimit = process.env.MX_GAS_LIMIT || 6000000;

export type Payment = [string, string];

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

  filterAddressesToReward(addressFortunesEntries: any[]): string[] {
    const filteredResults: any = [];
    const tmpHashMap: any = {};

    addressFortunesEntries.forEach((fortuneEntry) => {
      const { fortune } = fortuneEntry;
      if (tmpHashMap[fortune]) {
        return;
      }

      tmpHashMap[fortune] = true;
      filteredResults.push(fortuneEntry);
    });

    return filteredResults.map((fortune: { worker: any }) => fortune.worker);
  }

  private toVariadicType(data: Array<Payment>): VariadicValue {
    const tupleType = new TupleType();
    const variadicType = new VariadicType(tupleType);
    const items: Tuple[] = [];
    for (const payment of data) {
      const [workerAddress, reward] = payment;
      const tuple = new Tuple(tupleType, [
        new Field(new AddressValue(new Address(workerAddress))),
        new Field(new U64Value(reward)),
      ]);

      items.push(tuple);
    }

    return new VariadicValue(variadicType, items);
  }

  bulkPayOut(
    escrowAddress: string,
    workerAddresses: string[],
    rewards: string[],
    resultsUrl: string,
    resultHash: string
  ): Promise<unknown> {
    throw new Error();
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
