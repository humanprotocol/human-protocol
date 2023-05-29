/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, expect, vi, beforeEach, beforeAll } from 'vitest';
import { Signer, ethers } from 'ethers';
import { KVStoreClient } from '../src/kvstore';
import {
  ErrorInvalidAddress,
  ErrorKVStoreArrayLength,
  ErrorKVStoreEmptyKey,
  ErrorSigner,
} from '../src/error';
import { InitClient } from '../src/init';
import { ChainId } from '../src/enums';
import { NETWORKS } from '../src/constants';
import { NetworkData } from '../src/types';

vi.mock('../src/init');

describe('KVStoreClient', () => {
  let provider: ethers.providers.JsonRpcProvider;
  let signer: Signer;
  let network: NetworkData | undefined;
  let kvStoreClient: any;
  let mockKVStoreContract: any;
  let mockGetClientParams: any;

  beforeAll(async () => {
    provider = new ethers.providers.JsonRpcProvider();
    signer = provider.getSigner();
    network = NETWORKS[ChainId.LOCALHOST];
    mockGetClientParams = InitClient.getParams as jest.Mock;
  });

  beforeEach(async () => {
    mockGetClientParams.mockResolvedValue({
      signerOrProvider: signer,
      network,
    });
    kvStoreClient = new KVStoreClient(await InitClient.getParams(signer));
    mockKVStoreContract = {
      ...kvStoreClient.contract,
      set: vi.fn(),
      setBulk: vi.fn(),
      get: vi.fn(),
      address: network?.kvstoreAddress,
    };
    kvStoreClient.contract = mockKVStoreContract;
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
      expect(kvStoreClient.set('key1', 'value1')).resolves.toBeUndefined();
      expect(mockKVStoreContract.set).toHaveBeenCalledWith('key1', 'value1');
    });

    test('should throw an error when attempting to set a value without signer', async () => {
      mockGetClientParams.mockResolvedValue({
        signerOrProvider: provider,
        network,
      });
      kvStoreClient = new KVStoreClient(await InitClient.getParams(provider));

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

      expect(mockKVStoreContract.set).toHaveBeenCalledWith('key1', 'value1');
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
      expect(
        kvStoreClient.setBulk(['key1', 'key2'], ['value1', 'value2'])
      ).resolves.resolves.toBeUndefined();
      expect(mockKVStoreContract.setBulk).toHaveBeenCalledWith(
        ['key1', 'key2'],
        ['value1', 'value2']
      );
    });

    test('should throw an error when attempting to set values without signer', async () => {
      mockGetClientParams.mockResolvedValue({
        provider,
        network,
      });
      kvStoreClient = new KVStoreClient(await InitClient.getParams(provider));

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
        ['value1', 'value2']
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
});
