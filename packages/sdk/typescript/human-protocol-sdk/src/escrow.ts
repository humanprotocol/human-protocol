/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Escrow,
  EscrowFactory,
  EscrowFactory__factory,
  Escrow__factory,
} from '@human-protocol/core/typechain-types';
import { Signer, ethers } from 'ethers';
import { Provider } from '@ethersproject/abstract-provider';
import { ErrorInvalidAddress, ErrorSigner } from './error';
import { IClientParams } from './interfaces';

export default class EscrowClient {
  private factoryContract: EscrowFactory;
  private signerOrProvider: Signer | Provider;

  /**
   * **Escrow constructor**
   *
   *   * @param {IClientParams} clientParams - Init client parameters
   */
  constructor(readonly clientParams: IClientParams) {
    this.factoryContract = EscrowFactory__factory.connect(
      clientParams.network.factoryAddress,
      clientParams.signerOrProvider
    );
    this.signerOrProvider = clientParams.signerOrProvider;
  }

  /**
   * Create a new escrow
   *
   * @param {string} token - The address of the token contract
   * @param {string[]} trustedHandlers - The addresses of the trusted handlers
   * @returns {Promise<string>}
   * @throws {Error} - An error object if an error occurred
   */
  public async createEscrow(token: string, trustedHandlers: string[]) {
    if (!Signer.isSigner(this.signerOrProvider)) throw ErrorSigner;
    if (!ethers.utils.isAddress(token)) throw ErrorInvalidAddress;
    trustedHandlers.forEach((trustedHandler) => {
      if (!ethers.utils.isAddress(trustedHandler)) throw ErrorInvalidAddress;
    });
    try {
      return await this.factoryContract.createEscrow(token, trustedHandlers);
    } catch (e: any) {
      let reason: string;
      if (e.message.includes('VM Exception'))
        reason = e.reason.substring(
          e.reason.indexOf("reverted with reason string '") + 29,
          e.reason.indexOf(
            "'",
            e.reason.indexOf("reverted with reason string '") + 29
          )
        );
      else reason = e.message;
      throw Error(`Failed to create escrow: ${reason}`);
    }
  }
}
