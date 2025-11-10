/* eslint-disable @typescript-eslint/no-non-null-assertion */

vi.mock('graphql-request', () => {
  return {
    default: vi.fn(),
  };
});

import * as gqlFetch from 'graphql-request';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ChainId } from '../src';
import { NETWORKS } from '../src/constants';
import {
  ContractExecutionError,
  EthereumError,
  InvalidArgumentError,
  NonceExpired,
  NumericFault,
  ReplacementUnderpriced,
  TransactionReplaced,
  WarnSubgraphApiKeyNotProvided,
} from '../src/error';
import {
  getSubgraphUrl,
  getUnixTimestamp,
  customGqlFetch,
  isIndexerError,
  isValidJson,
  isValidUrl,
  throwError,
} from '../src/utils';

describe('isValidUrl', () => {
  test.each([
    'http://localhost:3000',
    'http://minio:9000',
    'http://reputation-oracle:5000',
    'http://example.com',
    'https://example.com/path',
    'http://service:8080/path',
    'http://127.0.0.1:8080',
    'https://sub.domain.local',
  ])('returns true for valid url: %s', (url) => {
    expect(isValidUrl(url)).toBe(true);
  });

  test.each([
    '',
    'example.com',
    'ftp://example.com',
    'http://',
    'http://:8080',
    'http://white space',
    'minio:9000',
    'localhost:3000',
  ])('returns false for invalid url: %s', (url) => {
    expect(isValidUrl(url)).toBe(false);
  });
});

describe('isValidJson', () => {
  test('returns true for valid JSON', () => {
    expect(isValidJson('{"a":1}')).toBe(true);
    expect(isValidJson('[1,2,3]')).toBe(true);
    expect(isValidJson('"string"')).toBe(true);
  });
  test('returns false for invalid JSON', () => {
    expect(isValidJson('{a:1}')).toBe(false);
    expect(isValidJson('not json')).toBe(false);
    expect(isValidJson('')).toBe(false);
  });
});

describe('getUnixTimestamp', () => {
  test('returns correct unix timestamp for a date', () => {
    const date = new Date();
    expect(getUnixTimestamp(date)).toBe(Math.floor(date.getTime() / 1000));
  });
});

describe('getSubgraphUrl', () => {
  const networkData = NETWORKS[ChainId.LOCALHOST]!;

  test('returns subgraphUrl if no API key', () => {
    delete process.env.SUBGRAPH_API_KEY;
    expect(getSubgraphUrl(networkData)).toBe(networkData.subgraphUrl);
  });

  test('returns subgraphUrlApiKey with replaced key if API key present', () => {
    process.env.SUBGRAPH_API_KEY = 'real-key';
    const url = getSubgraphUrl({
      ...networkData,
      subgraphUrlApiKey:
        'http://localhost:8000/subgraphs/name/humanprotocol/localhost?key=real-key',
    });
    expect(url).toContain('real-key');
    delete process.env.SUBGRAPH_API_KEY;
  });

  test('warns if no API key and not localhost', () => {
    const spy = vi.spyOn(console, 'warn').mockReturnValueOnce(undefined);
    getSubgraphUrl({ ...networkData, chainId: 1 });
    expect(spy).toHaveBeenCalledWith(WarnSubgraphApiKeyNotProvided);
  });
});

describe('throwError', () => {
  test.each([
    [
      {
        code: 'INVALID_ARGUMENT',
      },
      InvalidArgumentError,
    ],
    [
      {
        code: 'CALL_EXCEPTION',
      },
      ContractExecutionError,
    ],
    [
      {
        code: 'TRANSACTION_REPLACED',
      },
      TransactionReplaced,
    ],
    [
      {
        code: 'REPLACEMENT_UNDERPRICED',
      },
      ReplacementUnderpriced,
    ],
    [
      {
        code: 'NUMERIC_FAULT',
      },
      NumericFault,
    ],
    [
      {
        code: 'NONCE_EXPIRED',
      },
      NonceExpired,
    ],
    [
      {
        code: 'UNKNOWN',
      },
      EthereumError,
    ],
  ])('throws %p as %p', (errorObj, expectedError) => {
    expect(() => throwError(errorObj)).toThrow(expectedError);
  });
});

describe('isIndexerError', () => {
  test('returns false for null/undefined errors', () => {
    expect(isIndexerError(null)).toBe(false);
    expect(isIndexerError(undefined)).toBe(false);
    expect(isIndexerError('')).toBe(false);
  });

  test('returns true for GraphQL errors with "bad indexers" message', () => {
    const error = {
      response: {
        errors: [
          {
            message:
              'bad indexers: {0xbdfb5ee5a2abf4fc7bb1bd1221067aef7f9de491: Timeout}',
          },
        ],
      },
    };
    expect(isIndexerError(error)).toBe(true);
  });

  test('returns false for regular GraphQL errors', () => {
    const error = {
      response: {
        errors: [
          {
            message: 'Field "unknownField" is not defined',
          },
        ],
      },
    };
    expect(isIndexerError(error)).toBe(false);
  });

  test('returns false for network/connection errors', () => {
    const error = {
      message: 'Network error: ECONNREFUSED',
    };
    expect(isIndexerError(error)).toBe(false);
  });

  test('returns false for validation errors', () => {
    const error = {
      message: 'Invalid query syntax',
    };
    expect(isIndexerError(error)).toBe(false);
  });
});

describe('customGqlFetch', () => {
  const mockUrl = 'http://test-subgraph.com';
  const mockQuery = 'query { test }';
  const mockVariables = { id: '123' };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  test('calls gqlFetch directly when no config provided', async () => {
    const expectedResult = { data: 'test' };
    const gqlFetchSpy = vi
      .spyOn(gqlFetch, 'default')
      .mockResolvedValue(expectedResult);

    const result = await customGqlFetch(mockUrl, mockQuery, mockVariables);

    expect(gqlFetchSpy).toHaveBeenCalledTimes(1);
    expect(gqlFetchSpy).toHaveBeenCalledWith(mockUrl, mockQuery, mockVariables);
    expect(result).toBe(expectedResult);
  });

  test('succeeds on first attempt with config', async () => {
    const expectedResult = { data: 'test' };
    const gqlFetchSpy = vi
      .spyOn(gqlFetch, 'default')
      .mockResolvedValue(expectedResult);

    const result = await customGqlFetch(mockUrl, mockQuery, mockVariables, {
      maxRetries: 3,
      baseDelay: 100,
    });

    expect(gqlFetchSpy).toHaveBeenCalledTimes(1);
    expect(result).toBe(expectedResult);
  });

  test('retries on bad indexers error', async () => {
    const badIndexerError = {
      response: {
        errors: [{ message: 'bad indexers: {0x123: Timeout}' }],
      },
    };
    const expectedResult = { data: 'success' };
    const gqlFetchSpy = vi
      .spyOn(gqlFetch, 'default')
      .mockRejectedValueOnce(badIndexerError)
      .mockRejectedValueOnce(badIndexerError)
      .mockResolvedValueOnce(expectedResult);

    const result = await customGqlFetch(mockUrl, mockQuery, mockVariables, {
      maxRetries: 3,
      baseDelay: 10,
    });

    expect(gqlFetchSpy).toHaveBeenCalledTimes(3);
    expect(result).toBe(expectedResult);
  });

  test('throws immediately on non-indexer errors', async () => {
    const regularError = new Error('Regular GraphQL error');
    const gqlFetchSpy = vi
      .spyOn(gqlFetch, 'default')
      .mockRejectedValue(regularError);

    await expect(
      customGqlFetch(mockUrl, mockQuery, mockVariables, {
        maxRetries: 3,
        baseDelay: 10,
      })
    ).rejects.toThrow('Regular GraphQL error');

    expect(gqlFetchSpy).toHaveBeenCalledTimes(1);
  });

  test('throws after max retries exceeded', async () => {
    const badIndexerError = {
      response: {
        errors: [{ message: 'bad indexers: {0x123: Timeout}' }],
      },
    };
    const gqlFetchSpy = vi
      .spyOn(gqlFetch, 'default')
      .mockRejectedValue(badIndexerError);

    await expect(
      customGqlFetch(mockUrl, mockQuery, mockVariables, {
        maxRetries: 2,
        baseDelay: 10,
      })
    ).rejects.toEqual(badIndexerError);

    expect(gqlFetchSpy).toHaveBeenCalledTimes(3);
  });

  test('uses default values for missing maxRetries', async () => {
    const badIndexerError = {
      response: {
        errors: [{ message: 'bad indexers: {0x123: Timeout}' }],
      },
    };
    const gqlFetchSpy = vi
      .spyOn(gqlFetch, 'default')
      .mockRejectedValue(badIndexerError);

    await expect(
      customGqlFetch(mockUrl, mockQuery, mockVariables, { baseDelay: 10 })
    ).rejects.toEqual(badIndexerError);

    expect(gqlFetchSpy).toHaveBeenCalledTimes(4);
  });

  test('uses custom maxRetries when provided', async () => {
    const badIndexerError = {
      response: {
        errors: [{ message: 'bad indexers: {0x123: Timeout}' }],
      },
    };
    const gqlFetchSpy = vi
      .spyOn(gqlFetch, 'default')
      .mockRejectedValue(badIndexerError);

    await expect(
      customGqlFetch(mockUrl, mockQuery, mockVariables, {
        maxRetries: 1,
        baseDelay: 10,
      })
    ).rejects.toEqual(badIndexerError);

    expect(gqlFetchSpy).toHaveBeenCalledTimes(2);
  });
});
