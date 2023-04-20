/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Signer, ethers } from 'ethers';
import KVStoreClient from '../src/kvstore';

describe('KVStoreClient', () => {
  let kvStoreClient: KVStoreClient;
  let provider: ethers.providers.JsonRpcProvider;
  let signer: Signer;

  beforeEach(async () => {
    provider = new ethers.providers.JsonRpcProvider();
    signer = provider.getSigner();
    kvStoreClient = new KVStoreClient(signer);
  });

  describe('set', () => {
    test('should return an error if key or value is empty', async () => {
      const setSpy = vi.spyOn(kvStoreClient, 'set');
      expect(await kvStoreClient.set('', '')).toEqual(
        Error('Key and value can not be empty')
      );
      expect(setSpy).toHaveBeenCalledWith('', '');
    });

    test('should set the key-value pair if both key and value are provided', async () => {
      const mockSet = vi.fn();
      (kvStoreClient as any)['contract'] = { set: mockSet };
      mockSet.mockResolvedValue(null);
      const setSpy = vi.spyOn(kvStoreClient, 'set');
      expect(kvStoreClient.set('key1', 'value1')).resolves.toBeNull();
      expect(setSpy).toHaveBeenCalledWith('key1', 'value1');
    });

    test('should return an error if a network error occurs', async () => {
      const mockSet = vi.fn();
      (kvStoreClient as any)['contract'] = { set: mockSet };

      mockSet.mockRejectedValue(new Error('could not detect network'));

      expect(await kvStoreClient.set('key1', 'value1')).toEqual(
        Error('Failed to set value for key key1: could not detect network')
      );

      expect(mockSet).toHaveBeenCalledWith('key1', 'value1');
    });
  });

  describe('setBulk', () => {
    test('should return an error if keys and values arrays are not of the same length', async () => {
      const setBulkSpy = vi.spyOn(kvStoreClient, 'setBulk');
      expect(await kvStoreClient.setBulk(['key1', 'key2'], ['value1'])).toEqual(
        Error('Arrays must have the same length')
      );
      expect(setBulkSpy).toHaveBeenCalledWith(['key1', 'key2'], ['value1']);
    });

    test('should return an error if any of the keys or values is empty', async () => {
      const setBulkSpy = vi.spyOn(kvStoreClient, 'setBulk');
      expect(await kvStoreClient.setBulk(['key1', ''], ['value1', ''])).toEqual(
        Error('Keys and values can not be empty')
      );
      expect(setBulkSpy).toHaveBeenCalledWith(['key1', ''], ['value1', '']);
    });

    test('should set the key-value pairs if both keys and values arrays are provided correctly', async () => {
      const mockBulk = vi.fn();
      (kvStoreClient as any)['contract'] = { setBulk: mockBulk };
      mockBulk.mockResolvedValue(null);
      const setBulkSpy = vi.spyOn(kvStoreClient, 'setBulk');

      expect(
        kvStoreClient.setBulk(['key1', 'key2'], ['value1', 'value2'])
      ).resolves.toBeNull();
      expect(setBulkSpy).toHaveBeenCalledWith(
        ['key1', 'key2'],
        ['value1', 'value2']
      );
    });

    test('should return an error if a network error occurs', async () => {
      const mockBulk = vi.fn();
      (kvStoreClient as any)['contract'] = { setBulk: mockBulk };

      mockBulk.mockRejectedValue(new Error('could not detect network'));
      const a = await kvStoreClient.setBulk(
        ['key1', 'key2'],
        ['value1', 'value2']
      );

      expect(a).toEqual(
        new Error('Failed to set bulk values: could not detect network')
      );

      expect(mockBulk).toHaveBeenCalledWith(
        ['key1', 'key2'],
        ['value1', 'value2']
      );
    });
  });

  describe('get', () => {
    test('should return an error if key is empty', async () => {
      const result = await kvStoreClient.get(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
        ''
      );
      expect(result).toEqual(Error('Key can not be empty'));
    });

    test('should return an error if address is not valid', async () => {
      const result = await kvStoreClient.get('invalid_address', 'key1');
      expect(result).toEqual(Error('Invalid address'));
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

    test('should return empty string if both address and key are valid and address set a value', async () => {
      const mockGet = vi.fn();
      (kvStoreClient as any)['contract'] = { get: mockGet };
      mockGet.mockResolvedValue('value1');

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
      expect(mockGet).toHaveBeenCalledWith(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
        'key1'
      );
    });

    test('should return an error if a network error occurs', async () => {
      const mockGet = vi.fn();
      (kvStoreClient as any)['contract'] = { get: mockGet };

      mockGet.mockRejectedValue(new Error('could not detect network'));

      expect(
        await kvStoreClient.get(
          '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
          'key1'
        )
      ).toEqual(
        Error('Failed to get value for key key1: could not detect network')
      );

      expect(mockGet).toHaveBeenCalledWith(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
        'key1'
      );
    });
  });
});
