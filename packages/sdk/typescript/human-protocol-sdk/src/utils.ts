/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from 'ethers';

import { ChainId } from './enums';
import {
  ContractExecutionError,
  EthereumError,
  InvalidArgumentError,
  NonceExpired,
  NumericFault,
  ReplacementUnderpriced,
  TransactionReplaced,
  WarnSubgraphApiKeyNotProvided,
} from './error';
import { NetworkData } from './types';
import { SUBGRAPH_API_KEY_PLACEHOLDER } from './constants';

/**
 * **Handle and throw the error.*
 *
 * @param {any} e
 * @returns
 */
export const throwError = (e: any) => {
  if (ethers.isError(e, 'INVALID_ARGUMENT')) {
    throw new InvalidArgumentError(e.message);
  } else if (ethers.isError(e, 'CALL_EXCEPTION')) {
    throw new ContractExecutionError(e.reason as string);
  } else if (ethers.isError(e, 'TRANSACTION_REPLACED')) {
    throw new TransactionReplaced(e.message);
  } else if (ethers.isError(e, 'REPLACEMENT_UNDERPRICED')) {
    throw new ReplacementUnderpriced(e.message);
  } else if (ethers.isError(e, 'NUMERIC_FAULT')) {
    throw new NumericFault(e.message);
  } else if (ethers.isError(e, 'NONCE_EXPIRED')) {
    throw new NonceExpired(e.message);
  } else {
    throw new EthereumError(e.message);
  }
};

/**
 * **URL validation.*
 *
 * @param {string} url
 * @returns
 */
export const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * **Check if a string is a valid JSON.*
 *
 * @param {string} input
 * @returns {boolean}
 */
export const isValidJson = (input: string): boolean => {
  try {
    JSON.parse(input);
    return true;
  } catch {
    return false;
  }
};

/**
 * **Get the subgraph URL.*
 *
 * @param {NetworkData} networkData
 * @returns
 */
export const getSubgraphUrl = (networkData: NetworkData) => {
  let subgraphUrl = networkData.subgraphUrl;
  if (process.env.SUBGRAPH_API_KEY) {
    subgraphUrl = networkData.subgraphUrlApiKey.replace(
      SUBGRAPH_API_KEY_PLACEHOLDER,
      process.env.SUBGRAPH_API_KEY
    );
  } else if (networkData.chainId !== ChainId.LOCALHOST) {
    // eslint-disable-next-line no-console
    console.warn(WarnSubgraphApiKeyNotProvided);
  }

  return subgraphUrl;
};

/**
 * **Convert a date to Unix timestamp (seconds since epoch).*
 *
 * @param {Date} date
 * @returns {number}
 */
export const getUnixTimestamp = (date: Date): number => {
  return Math.floor(date.getTime() / 1000);
};
