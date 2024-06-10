/* eslint-disable @typescript-eslint/no-explicit-any */
import { Overrides, ethers } from 'ethers';
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { NETWORKS } from '../src/constants';
import { ChainId } from '../src/enums';
import {
  ErrorInvalidAddress,
  ErrorInvalidHash,
  ErrorInvalidUrl,
  ErrorKVStoreArrayLength,
  ErrorKVStoreEmptyKey,
  ErrorProviderDoesNotExist,
  ErrorSigner,
  ErrorUnsupportedChainID,
} from '../src/error';
import { KVStoreClient, KVStoreUtils } from '../src/kvstore';
import { NetworkData } from '../src/types';
import { DEFAULT_GAS_PAYER_PRIVKEY } from './utils/constants';
import * as gqlFetch from 'graphql-request';
import { GET_KVSTORE_BY_ADDRESS_QUERY } from '../src/graphql/queries/kvstore';

global.fetch = vi.fn().mockResolvedValue({
  text: () => Promise.resolve('example'),
});

vi.mock('graphql-request', () => {
  return {
    default: vi.fn(),
  };
});

describe('KVStoreClient', () => {
  let mockProvider: any,
    mockSigner: any,
    network: NetworkData | undefined,
    kvStoreClient: any,
    mockKVStoreContract: any;

  beforeAll(async () => {
    mockProvider = {
      provider: {
        getNetwork: vi.fn().mockReturnValue({ chainId: ChainId.LOCALHOST }),
      },
    };
    mockSigner = {
      provider: mockProvider.provider,
      getAddress: vi.fn().mockReturnValue(ethers.ZeroAddress),
    };
    network = NETWORKS[ChainId.LOCALHOST];
  });

  beforeEach(async () => {
    kvStoreClient = await KVStoreClient.build(mockSigner);
    mockKVStoreContract = {
      ...kvStoreClient.contract,
      set: vi.fn(),
      setBulk: vi.fn(),
      get: vi.fn(),
      address: network?.kvstoreAddress,
    };
    kvStoreClient.contract = mockKVStoreContract;
  });

  describe('build', () => {
    test('should create a new instance of KVStoreClient with a Signer', async () => {
      const kvStoreClient = await KVStoreClient.build(mockSigner);

      expect(kvStoreClient).toBeInstanceOf(KVStoreClient);
    });

    test('should create a new instance of KVStoreClient with a Provider', async () => {
      const kvStoreClient = await KVStoreClient.build(mockProvider);

      expect(kvStoreClient).toBeInstanceOf(KVStoreClient);
    });

    test('should throw an error if Signer provider does not exist', async () => {
      const signer = new ethers.Wallet(DEFAULT_GAS_PAYER_PRIVKEY);

      await expect(KVStoreClient.build(signer)).rejects.toThrow(
        ErrorProviderDoesNotExist
      );
    });

    test('should throw an error if the chain ID is unsupported', async () => {
      const provider = new ethers.JsonRpcProvider();

      vi.spyOn(provider, 'getNetwork').mockResolvedValue({
        chainId: 1337,
      } as any);

      await expect(KVStoreClient.build(provider)).rejects.toThrow(
        ErrorUnsupportedChainID
      );
    });
  });

  describe('set', () => {
    test('should throw an error if key is empty', async () => {
      const setSpy = vi.spyOn(kvStoreClient, 'set');
      await expect(kvStoreClient.set('', 'test')).rejects.toThrow(
        ErrorKVStoreEmptyKey
      );
      expect(setSpy).toHaveBeenCalledWith('', 'test');
    });

    test('should set the key-value pair if both key and value are provided', async () => {
      mockKVStoreContract.set.mockResolvedValue(null);
      const setSpy = vi
        .spyOn(mockKVStoreContract, 'set')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));
      expect(await kvStoreClient.set('key1', 'value1')).toBeUndefined();
      expect(setSpy).toHaveBeenCalledWith('key1', 'value1', {});
    });

    test('should throw an error when attempting to set a value without signer', async () => {
      kvStoreClient = await KVStoreClient.build(mockProvider);

      await expect(kvStoreClient.set('key1', 'value1')).rejects.toThrow(
        ErrorSigner
      );
    });

    test('should throw an error when a network error occurs', async () => {
      mockKVStoreContract.set.mockRejectedValue(
        new Error('could not detect network')
      );

      await expect(kvStoreClient.set('key1', 'value1')).rejects.toThrow(
        Error('Failed to set value: could not detect network')
      );

      expect(mockKVStoreContract.set).toHaveBeenCalledWith(
        'key1',
        'value1',
        {}
      );
    });

    test('should set the key-value pair if both key and value are provided with transaction options', async () => {
      mockKVStoreContract.set.mockResolvedValue(null);
      const setSpy = vi
        .spyOn(mockKVStoreContract, 'set')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));
      const txOptions: Overrides = { gasLimit: 45000 };
      expect(
        await kvStoreClient.set('key1', 'value1', txOptions)
      ).toBeUndefined();
      expect(setSpy).toHaveBeenCalledWith('key1', 'value1', txOptions);
    });
  });

  describe('setFileUrlAndHash', () => {
    test('should set the URL and hash', async () => {
      mockKVStoreContract.set.mockResolvedValue(null);
      const setBulkSpy = vi
        .spyOn(mockKVStoreContract, 'setBulk')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      expect(
        await kvStoreClient.setFileUrlAndHash('https://example.com')
      ).toBeUndefined();

      expect(setBulkSpy).toHaveBeenCalledWith(
        ['url', 'url_hash'],
        [
          'https://example.com',
          ethers.keccak256(ethers.toUtf8Bytes('example')),
        ],
        {}
      );
    });

    test('should set the URL and hash for the given URL key', async () => {
      mockKVStoreContract.set.mockResolvedValue(null);
      const setBulkSpy = vi
        .spyOn(mockKVStoreContract, 'setBulk')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      expect(
        await kvStoreClient.setFileUrlAndHash(
          'https://example.com',
          'linkedin_url'
        )
      ).toBeUndefined();

      expect(setBulkSpy).toHaveBeenCalledWith(
        ['linkedin_url', 'linkedin_url_hash'],
        [
          'https://example.com',
          ethers.keccak256(ethers.toUtf8Bytes('example')),
        ],
        {}
      );
    });

    test('should throw an error when attempting to set the URL without signer', async () => {
      kvStoreClient = await KVStoreClient.build(mockProvider);

      await expect(
        kvStoreClient.setFileUrlAndHash('example.com')
      ).rejects.toThrow(ErrorSigner);
    });

    test('should throw an error when attempting to set invalid URL', async () => {
      await expect(
        kvStoreClient.setFileUrlAndHash('invalid_url')
      ).rejects.toThrow(ErrorInvalidUrl);
    });

    test('should throw an error when a network error occurs', async () => {
      mockKVStoreContract.setBulk.mockRejectedValue(
        new Error('could not detect network')
      );

      await expect(
        kvStoreClient.setFileUrlAndHash('https://example.com')
      ).rejects.toThrow(
        Error('Failed to set URL and hash: could not detect network')
      );

      expect(mockKVStoreContract.setBulk).toHaveBeenCalledWith(
        ['url', 'url_hash'],
        [
          'https://example.com',
          ethers.keccak256(ethers.toUtf8Bytes('example')),
        ],
        {}
      );
    });

    test('should set the URL and hash for the given URL key with transaction options', async () => {
      mockKVStoreContract.set.mockResolvedValue(null);
      const setBulkSpy = vi
        .spyOn(mockKVStoreContract, 'setBulk')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      const txOptions: Overrides = { gasLimit: 45000 };

      expect(
        await kvStoreClient.setFileUrlAndHash(
          'https://example.com',
          'linkedin_url',
          txOptions
        )
      ).toBeUndefined();

      expect(setBulkSpy).toHaveBeenCalledWith(
        ['linkedin_url', 'linkedin_url_hash'],
        [
          'https://example.com',
          ethers.keccak256(ethers.toUtf8Bytes('example')),
        ],
        txOptions
      );
    });
  });

  describe('setBulk', () => {
    test('should throw an error if keys and values arrays are not of the same length', async () => {
      const setBulkSpy = vi.spyOn(kvStoreClient, 'setBulk');
      await expect(
        kvStoreClient.setBulk(['key1', 'key2'], ['value1'])
      ).rejects.toThrow(ErrorKVStoreArrayLength);
      expect(setBulkSpy).toHaveBeenCalledWith(['key1', 'key2'], ['value1']);
    });

    test('should throw an error if any of the keys is empty', async () => {
      const setBulkSpy = vi.spyOn(kvStoreClient, 'setBulk');
      await expect(
        kvStoreClient.setBulk(['key1', ''], ['value1', 'value2'])
      ).rejects.toThrow(ErrorKVStoreEmptyKey);
      expect(setBulkSpy).toHaveBeenCalledWith(
        ['key1', ''],
        ['value1', 'value2']
      );
    });

    test('should set the key-value pairs if both keys and values arrays are provided correctly', async () => {
      mockKVStoreContract.setBulk.mockResolvedValue(null);
      const setBulkSpy = vi
        .spyOn(mockKVStoreContract, 'setBulk')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));
      expect(
        await kvStoreClient.setBulk(['key1', 'key2'], ['value1', 'value2'])
      ).toBeUndefined();
      expect(setBulkSpy).toHaveBeenCalledWith(
        ['key1', 'key2'],
        ['value1', 'value2'],
        {}
      );
    });

    test('should throw an error when attempting to set values without signer', async () => {
      kvStoreClient = await KVStoreClient.build(mockProvider);

      await expect(
        kvStoreClient.setBulk(['key1', 'key2'], ['value1', 'value2'])
      ).rejects.toThrow(ErrorSigner);
    });

    test('should throw an error if a network error occurs', async () => {
      mockKVStoreContract.setBulk.mockRejectedValue(
        new Error('could not detect network')
      );
      await expect(
        kvStoreClient.setBulk(['key1', 'key2'], ['value1', 'value2'])
      ).rejects.toThrow(
        new Error('Failed to set bulk values: could not detect network')
      );
      expect(mockKVStoreContract.setBulk).toHaveBeenCalledWith(
        ['key1', 'key2'],
        ['value1', 'value2'],
        {}
      );
    });

    test('should set the key-value pairs with transaction options', async () => {
      mockKVStoreContract.setBulk.mockResolvedValue(null);
      const setBulkSpy = vi
        .spyOn(mockKVStoreContract, 'setBulk')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));
      const txOptions: Overrides = { gasLimit: 45000 };
      expect(
        await kvStoreClient.setBulk(
          ['key1', 'key2'],
          ['value1', 'value2'],
          txOptions
        )
      ).toBeUndefined();
      expect(setBulkSpy).toHaveBeenCalledWith(
        ['key1', 'key2'],
        ['value1', 'value2'],
        txOptions
      );
    });
  });

  describe('get', () => {
    test('should throw an error if key is empty', async () => {
      await expect(
        kvStoreClient.get('0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71', '')
      ).rejects.toThrow(ErrorKVStoreEmptyKey);
    });

    test('should throw an error if address is not valid', async () => {
      await expect(
        kvStoreClient.get('invalid_address', 'key1')
      ).rejects.toThrow(ErrorInvalidAddress);
    });

    test('should return empty string if both address and key are valid and address does not set any value', async () => {
      const getSpy = vi.spyOn(kvStoreClient, 'get').mockResolvedValue('');
      const result = await kvStoreClient.get(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
        'key1'
      );
      expect(result).toBe('');
      expect(getSpy).toHaveBeenCalledWith(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
        'key1'
      );
    });

    test('should return value if both address and key are valid and address set a value', async () => {
      mockKVStoreContract.get.mockResolvedValue('value1');

      const getSpy = vi.spyOn(kvStoreClient, 'get');
      const result = await kvStoreClient.get(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
        'key1'
      );
      expect(result).toBe('value1');
      expect(getSpy).toHaveBeenCalledWith(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
        'key1'
      );
      expect(mockKVStoreContract.get).toHaveBeenCalledWith(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
        'key1'
      );
    });

    test('should throw an error if a network error occurs', async () => {
      mockKVStoreContract.get.mockRejectedValue(
        new Error('could not detect network')
      );

      await expect(
        kvStoreClient.get('0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71', 'key1')
      ).rejects.toThrow(Error('Failed to get value: could not detect network'));

      expect(mockKVStoreContract.get).toHaveBeenCalledWith(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
        'key1'
      );
    });
  });

  describe('getFileUrlAndVerifyHash', () => {
    test('should throw an error if address is not valid', async () => {
      await expect(
        kvStoreClient.getFileUrlAndVerifyHash('invalid_address')
      ).rejects.toThrow(ErrorInvalidAddress);
    });

    test('should return empty string if the URL is not set', async () => {
      mockKVStoreContract.get.mockResolvedValueOnce('');

      const result = await kvStoreClient.getFileUrlAndVerifyHash(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71'
      );
      expect(result).toBe('');
      expect(mockKVStoreContract.get).toHaveBeenCalledWith(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
        'url'
      );
    });

    test('should return URL if the content is valid', async () => {
      const validHash = ethers.keccak256(ethers.toUtf8Bytes('example'));

      mockKVStoreContract.get.mockResolvedValueOnce('example.com');
      mockKVStoreContract.get.mockResolvedValueOnce(validHash);

      const result = await kvStoreClient.getFileUrlAndVerifyHash(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71'
      );
      expect(result).toBe('example.com');

      expect(mockKVStoreContract.get).toHaveBeenCalledWith(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
        'url'
      );
      expect(mockKVStoreContract.get).toHaveBeenCalledWith(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
        'url_hash'
      );
    });

    test('should return URL for the given URL key if the content is valid', async () => {
      const validHash = ethers.keccak256(ethers.toUtf8Bytes('example'));

      mockKVStoreContract.get.mockResolvedValueOnce('example.com');
      mockKVStoreContract.get.mockResolvedValueOnce(validHash);

      const result = await kvStoreClient.getFileUrlAndVerifyHash(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
        'linkedin_url'
      );
      expect(result).toBe('example.com');

      expect(mockKVStoreContract.get).toHaveBeenCalledWith(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
        'linkedin_url'
      );
      expect(mockKVStoreContract.get).toHaveBeenCalledWith(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
        'linkedin_url_hash'
      );
    });

    test('should throw an error if the content is not valid', async () => {
      const invalidHash = ethers.keccak256(
        ethers.toUtf8Bytes('invalid-example')
      );

      mockKVStoreContract.get.mockResolvedValueOnce('example.com');
      mockKVStoreContract.get.mockResolvedValueOnce(invalidHash);

      await expect(
        kvStoreClient.getFileUrlAndVerifyHash(
          '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71'
        )
      ).rejects.toThrow(ErrorInvalidHash);

      expect(mockKVStoreContract.get).toHaveBeenCalledWith(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
        'url'
      );
      expect(mockKVStoreContract.get).toHaveBeenCalledWith(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
        'url_hash'
      );
    });

    test('should throw an error if a network error occurs', async () => {
      mockKVStoreContract.get.mockRejectedValue(
        new Error('could not detect network')
      );

      await expect(
        kvStoreClient.getFileUrlAndVerifyHash(
          '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71'
        )
      ).rejects.toThrow(Error('Failed to get URL: could not detect network'));

      expect(mockKVStoreContract.get).toHaveBeenCalledWith(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
        'url'
      );
    });
  });

  describe('getPublicKey', () => {
    test('should throw an error if address is not valid', async () => {
      await expect(
        kvStoreClient.getPublicKey('invalid_address')
      ).rejects.toThrow(ErrorInvalidAddress);
    });

    test('should return empty string if the public key is not set', async () => {
      mockKVStoreContract.get.mockResolvedValueOnce('');

      const result = await kvStoreClient.getPublicKey(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71'
      );
      expect(result).toBe('');
      expect(mockKVStoreContract.get).toHaveBeenCalledWith(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
        'public_key'
      );
    });

    test('should return public key if the content is valid', async () => {
      const validHash = ethers.keccak256(ethers.toUtf8Bytes('example'));

      mockKVStoreContract.get.mockResolvedValueOnce('PUBLIC_KEY_URL');
      mockKVStoreContract.get.mockResolvedValueOnce(validHash);

      const result = await kvStoreClient.getPublicKey(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71'
      );
      expect(result).toBe('example');

      expect(mockKVStoreContract.get).toHaveBeenCalledWith(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
        'public_key'
      );
      expect(mockKVStoreContract.get).toHaveBeenCalledWith(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
        'public_key_hash'
      );
    });

    test('should throw an error if the content is not valid', async () => {
      const invalidHash = ethers.keccak256(
        ethers.toUtf8Bytes('invalid-example')
      );

      mockKVStoreContract.get.mockResolvedValueOnce('PUBLIC_KEY_URL');
      mockKVStoreContract.get.mockResolvedValueOnce(invalidHash);

      await expect(
        kvStoreClient.getPublicKey('0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71')
      ).rejects.toThrow(ErrorInvalidHash);

      expect(mockKVStoreContract.get).toHaveBeenCalledWith(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
        'public_key'
      );
      expect(mockKVStoreContract.get).toHaveBeenCalledWith(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
        'public_key_hash'
      );
    });

    test('should throw an error if a network error occurs', async () => {
      mockKVStoreContract.get.mockRejectedValue(
        new Error('could not detect network')
      );

      await expect(
        kvStoreClient.getPublicKey('0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71')
      ).rejects.toThrow(Error('Failed to get URL: could not detect network'));

      expect(mockKVStoreContract.get).toHaveBeenCalledWith(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
        'public_key'
      );
    });
  });
});

describe('KVStoreUtils', () => {
  describe('getKVStoreData', () => {
    test('should throw an error if chain id is an unsupported id', async () => {
      const chainId = -1;
      const address = ethers.ZeroAddress;

      await expect(
        KVStoreUtils.getKVStoreData(chainId, address)
      ).rejects.toThrow(ErrorUnsupportedChainID);
    });

    test('should throw an error if escrow address is an invalid address', async () => {
      const chainId = ChainId.LOCALHOST;
      const address = '0x0';

      await expect(
        KVStoreUtils.getKVStoreData(chainId, address)
      ).rejects.toThrow(ErrorInvalidAddress);
    });

    test('should successfully get all data for the filter', async () => {
      const chainId = ChainId.LOCALHOST;

      const kvstores = [
        {
          id: ethers.ZeroAddress + '-fee',
          block: '31',
          timestamp: '1717510736',
          address: ethers.ZeroAddress,
          key: 'fee',
          value: '1',
        },
        {
          id: ethers.ZeroAddress + '-jwt_public_key',
          block: '33',
          timestamp: '1717510740',
          address: ethers.ZeroAddress,
          key: 'jwt_public_key',
          value: 'http://localhost:9000/bucket/public-key.txt',
        },
      ];

      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockResolvedValue({ kvstores });

      const result = await KVStoreUtils.getKVStoreData(
        chainId,
        ethers.ZeroAddress
      );

      expect(result).toEqual(
        kvstores.map((item) => ({
          key: item.key,
          value: item.value,
        }))
      );
      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.LOCALHOST]?.subgraphUrl,
        GET_KVSTORE_BY_ADDRESS_QUERY(),
        { address: ethers.ZeroAddress }
      );
    });
  });
});
