import { AbiRegistry, SmartContractAbi, SmartContract, Address, Interaction, TypedOutcomeBundle, ResultsParser } from '@multiversx/sdk-core/out';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers/out';
import escrowAbi from './abi/escrow.abi.json';
import { proxyNetwork } from '../../constants/constants';
import { EscrowInterface } from '../common/escrow-interface.service';


const abiRegistry = AbiRegistry.create(escrowAbi);
const abi = new SmartContractAbi(abiRegistry);


export class EscrowService implements EscrowInterface{
  contract: SmartContract;
  networkProvider: ProxyNetworkProvider;

  constructor(address: string) {
    const contractAdress = new Address(address);
    this.contract = new SmartContract({
      address: contractAdress,
      abi
    });
    this.networkProvider = new ProxyNetworkProvider(proxyNetwork);
  }

  async getStatus(): Promise<string> {
    const interaction = this.contract.methods.getStatus();
    try {
      const { firstValue } = await this.performQuery(interaction);

      return firstValue?.valueOf()?.name;
    } catch (err) {
      console.log('Error performing query -> getStatus');
      console.error(err);
      return '';
    }
  }

  async getBalance(): Promise<string> {
    const interaction = this.contract.methods.getBalance();
    const response = await this.performQuery(interaction);
    const firstValue = response.firstValue?.valueOf();

    return firstValue.toString();
  }

  async getManifest(): Promise<string> {
    const interaction = this.contract.methods.getManifest();
    const { firstValue } = await this.performQuery(interaction);

    return firstValue?.valueOf().url.toString();
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