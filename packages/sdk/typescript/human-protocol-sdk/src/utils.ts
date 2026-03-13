/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from 'ethers';
import gqlFetch from 'graphql-request';

import { isURL } from 'validator';
import { ChainId } from './enums';
import {
  ContractExecutionError,
  ErrorRetryParametersMissing,
  ErrorRoutingRequestsToIndexerRequiresApiKey,
  EthereumError,
  InvalidArgumentError,
  NonceExpired,
  NumericFault,
  ReplacementUnderpriced,
  SubgraphBadIndexerError,
  SubgraphRequestError,
  TransactionReplaced,
  WarnSubgraphApiKeyNotProvided,
} from './error';
import { SubgraphOptions } from './interfaces';
import { NetworkData } from './types';

/**
 * Handles and throws appropriate error types based on the Ethereum error.
 *
 * @param e - The error to handle
 * @throws {InvalidArgumentError} If the error is an invalid argument error
 * @throws {ContractExecutionError} If the error is a contract execution error
 * @throws {TransactionReplaced} If the transaction was replaced
 * @throws {ReplacementUnderpriced} If the replacement transaction was underpriced
 * @throws {NumericFault} If there's a numeric fault
 * @throws {NonceExpired} If the nonce has expired
 * @throws {EthereumError} For any other Ethereum-related error
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
 * Validates if a string is a valid URL.
 *
 * @param url - The URL string to validate
 * @returns True if the URL is valid, false otherwise
 */
export const isValidUrl = (url: string): boolean => {
  return isURL(url, {
    require_protocol: true,
    protocols: ['http', 'https'],
    require_tld: false,
  });
};

/**
 * Checks if a string is valid JSON.
 *
 * @param input - The string to check
 * @returns True if the string is valid JSON, false otherwise
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
 * Extracts a readable message from unknown error values.
 *
 * @param error - Unknown error value
 * @returns Human-readable error message
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

/**
 * Gets the subgraph URL for the given network, using API key if available.
 *
 * @param networkData - The network data containing subgraph URLs
 * @returns The subgraph URL with API key if available
 */
export const getSubgraphUrl = (networkData: NetworkData) => {
  let subgraphUrl = networkData.subgraphUrl;
  if (process.env.SUBGRAPH_API_KEY) {
    subgraphUrl = networkData.subgraphUrlApiKey;
  } else if (networkData.chainId !== ChainId.LOCALHOST) {
    // eslint-disable-next-line no-console
    console.warn(WarnSubgraphApiKeyNotProvided);
  }

  return subgraphUrl;
};

/**
 * Gets the HMT statistics subgraph URL for the given network.
 * Falls back to the default subgraph URL when a dedicated HMT endpoint is not configured.
 *
 * @param networkData - The network data containing subgraph URLs
 * @returns The HMT statistics subgraph URL with API key if available
 */
export const getHMTSubgraphUrl = (networkData: NetworkData) => {
  let subgraphUrl = networkData.hmtSubgraphUrl || networkData.subgraphUrl;
  if (process.env.SUBGRAPH_API_KEY) {
    subgraphUrl =
      networkData.hmtSubgraphUrlApiKey || networkData.subgraphUrlApiKey;
  } else if (networkData.chainId !== ChainId.LOCALHOST) {
    // eslint-disable-next-line no-console
    console.warn(WarnSubgraphApiKeyNotProvided);
  }

  return subgraphUrl;
};

/**
 * Converts a Date object to Unix timestamp (seconds since epoch).
 *
 * @param date - The date to convert
 * @returns Unix timestamp in seconds
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

const getSubgraphErrorMessage = (error: any): string => {
  return (
    error?.response?.errors?.[0]?.message ||
    error?.message ||
    error?.toString?.() ||
    'Subgraph request failed'
  );
};

const getSubgraphStatusCode = (error: any): number | undefined => {
  if (typeof error?.response?.status === 'number') {
    return error.response.status;
  }

  if (typeof error?.status === 'number') {
    return error.status;
  }

  return undefined;
};

const toSubgraphError = (error: any, url: string): Error => {
  const message = getSubgraphErrorMessage(error);
  const statusCode = getSubgraphStatusCode(error);

  if (isIndexerError(error)) {
    return new SubgraphBadIndexerError(message, url, statusCode);
  }

  return new SubgraphRequestError(message, url, statusCode);
};

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const buildIndexerUrl = (baseUrl: string, indexerId?: string): string => {
  if (!indexerId) {
    return baseUrl;
  }
  return `${baseUrl}/indexers/id/${indexerId}`;
};

/**
 * Executes a GraphQL request with automatic retry logic for bad indexer errors.
 * Only retries if options is provided with maxRetries and baseDelay.
 *
 * @param url - The GraphQL endpoint URL
 * @param query - The GraphQL query to execute
 * @param variables - Variables for the GraphQL query (optional)
 * @param options - Optional configuration for subgraph requests including retry logic
 * @returns The response data from the GraphQL query
 * @throws ErrorRetryParametersMissing If only one of maxRetries or baseDelay is provided
 * @throws ErrorRoutingRequestsToIndexerRequiresApiKey If indexerId is provided without API key
 */
export const customGqlFetch = async <T = any>(
  url: string,
  query: any,
  variables?: any,
  options?: SubgraphOptions
): Promise<T> => {
  const apiKey = process.env.SUBGRAPH_API_KEY;
  const headers = apiKey
    ? {
        Authorization: `Bearer ${apiKey}`,
      }
    : undefined;

  if (!options) {
    try {
      return await gqlFetch<T>(url, query, variables, headers);
    } catch (error) {
      throw toSubgraphError(error, url);
    }
  }

  const hasMaxRetries = options.maxRetries !== undefined;
  const hasBaseDelay = options.baseDelay !== undefined;

  if (hasMaxRetries !== hasBaseDelay) {
    throw ErrorRetryParametersMissing;
  }
  if (options.indexerId && !headers) {
    throw ErrorRoutingRequestsToIndexerRequiresApiKey;
  }

  const targetUrl = buildIndexerUrl(url, options.indexerId);

  const maxRetries = hasMaxRetries ? (options.maxRetries as number) : 0;
  const baseDelay = hasBaseDelay ? (options.baseDelay as number) : 0;
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await gqlFetch<T>(targetUrl, query, variables, headers);
    } catch (error) {
      const wrappedError = toSubgraphError(error, targetUrl);
      lastError = wrappedError;

      if (attempt === maxRetries || !isIndexerError(error)) {
        throw wrappedError;
      }

      const delay = baseDelay * attempt;
      await sleep(delay);
    }
  }

  throw lastError;
};
