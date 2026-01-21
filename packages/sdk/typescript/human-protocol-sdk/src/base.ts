import {
  ContractRunner,
  ContractTransactionReceipt,
  ContractTransactionResponse,
  Overrides,
} from 'ethers';
import { NetworkData, TransactionOverrides, WaitOptions } from './types';

/**
 * Base class for clients making on-chain calls.
 *
 * This class provides common functionality for interacting with Ethereum contracts.
 */
export abstract class BaseEthersClient {
  protected runner: ContractRunner;
  public networkData: NetworkData;

  /**
   * **BaseClient constructor**
   *
   * @param runner - The Signer or Provider object to interact with the Ethereum network
   * @param networkData - The network information required to connect to the contracts
   */
  constructor(runner: ContractRunner, networkData: NetworkData) {
    this.networkData = networkData;
    this.runner = runner;
  }

  protected normalizeTxOptions(
    txOptions?: TransactionOverrides
  ): [Overrides, WaitOptions] {
    const options = txOptions ?? {};
    const {
      confirmations: waitConfirmations,
      timeoutMs: waitTimeoutMs,
      ...overrides
    } = options;

    const waitOptions: WaitOptions = {
      confirmations: waitConfirmations,
      timeoutMs: waitTimeoutMs,
    };

    return [overrides as Overrides, waitOptions];
  }

  protected async sendTransaction(
    transaction: (overrides: Overrides) => Promise<ContractTransactionResponse>,
    txOptions?: TransactionOverrides
  ): Promise<ContractTransactionReceipt | null> {
    const [overrides, waitOptions] = this.normalizeTxOptions(txOptions);
    const transactionResponse = await transaction(overrides);

    return transactionResponse.wait(
      waitOptions.confirmations,
      waitOptions.timeoutMs
    );
  }
}
