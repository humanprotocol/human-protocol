/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, expect, test, vi } from 'vitest';
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
