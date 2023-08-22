/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from 'ethers';
import gqlFetch from 'graphql-request';

import { ErrorInvalidAddress } from './error';
import { IEscrowsFilter } from './interfaces';
import { NetworkData } from './types';
import { throwError } from './utils';
import { EscrowData, GET_FILTERED_ESCROWS_QUERY } from './graphql';

export class StatisticsClient {
  public network: NetworkData;

  /**
   * **StatisticsClient constructor**
   *
   * @param {NetworkData} network - The network information required to connect to the Statistics contract
   */
  constructor(network: NetworkData) {
    this.network = network;
  }

  /**
   * Returns the escrow addresses based on a specified filter.
   *
   * @param {IEscrowsFilter} filter - Filter parameters.
   * @returns {Promise<EscrowData[]>}
   * @throws {Error} - An error object if an error occurred.
   */
  async getEscrowsFiltered(filter: IEscrowsFilter): Promise<EscrowData[]> {
    if (
      filter?.launcherAddress &&
      !ethers.utils.isAddress(filter?.launcherAddress)
    ) {
      throw ErrorInvalidAddress;
    }

    try {
      const { escrows } = await gqlFetch<{ escrows: EscrowData[] }>(
        this.network.subgraphUrl,
        GET_FILTERED_ESCROWS_QUERY,
        {
          ...filter,
        }
      );

      return escrows;
    } catch (e: any) {
      return throwError(e);
    }
  }
}
