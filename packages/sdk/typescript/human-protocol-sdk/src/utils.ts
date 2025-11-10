/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from 'ethers';
import gqlFetch from 'graphql-request';

import { isURL } from 'validator';
import { SUBGRAPH_API_KEY_PLACEHOLDER } from './constants';
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
import { SubgraphOptions } from './interfaces';

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
export const isValidUrl = (url: string): boolean => {
  return isURL(url, {
    require_protocol: true,
    protocols: ['http', 'https'],
    require_tld: false,
  });
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

export const isIndexerError = (error: any): boolean => {
  if (!error) return false;

  const errorMessage =
    error.response?.errors?.[0]?.message ||
    error.message ||
    error.toString() ||
    '';
  return errorMessage.toLowerCase().includes('bad indexers');
};

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Execute a GraphQL request with automatic retry logic for bad indexer errors.
 * Only retries if options is provided.
 */
export const customGqlFetch = async <T = any>(
  url: string,
  query: any,
  variables?: any,
  options?: SubgraphOptions
): Promise<T> => {
  if (!options) {
    return await gqlFetch<T>(url, query, variables);
  }

  const maxRetries = options.maxRetries ?? 3;
  const baseDelay = options.baseDelay ?? 1000;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await gqlFetch<T>(url, query, variables);
      return result;
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        throw error;
      }

      if (!isIndexerError(error)) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);

      await sleep(delay);
    }
  }

  throw lastError;
};
