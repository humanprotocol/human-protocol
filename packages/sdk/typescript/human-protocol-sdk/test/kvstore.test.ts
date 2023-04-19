import { ethers } from 'ethers';
import KVStoreClient from '../src/kvstore';
import { DEFAULT_GAS_PAYER_PRIVKEY } from './utils/constants';

describe('KVStoreClient', () => {
  let kvStoreClient: KVStoreClient;

  beforeEach(async () => {
    const provider = new ethers.providers.JsonRpcProvider();
    const signer = new ethers.Wallet(DEFAULT_GAS_PAYER_PRIVKEY, provider);
    kvStoreClient = new KVStoreClient(signer);
  });

  describe('set', () => {
    it('should return an error if key or value is empty', async () => {
      const result = await kvStoreClient.set('', '');
      expect(result).toEqual(Error('Values can not be empty'));
    });

    it('should set the key-value pair if both key and value are provided', async () => {
      const result = await kvStoreClient.set('key1', 'value1');
      expect(result).toBeNull();
    });
  });

  describe('setBulk', () => {
    it('should return an error if keys and values arrays are not of the same length', async () => {
      const result = await kvStoreClient.setBulk(['key1', 'key2'], ['value1']);
      expect(result).toEqual(Error('Arrays must have the same length'));
    });

    it('should return an error if any of the keys or values is empty', async () => {
      const result = await kvStoreClient.setBulk(['key1', ''], ['value1', '']);
      expect(result).toEqual(Error('Values can not be empty'));
    });

    it('should set the key-value pairs if both keys and values arrays are provided correctly', async () => {
      const result = await kvStoreClient.setBulk(
        ['key1', 'key2'],
        ['value1', 'value2']
      );
      expect(result).toBeNull();
    });
  });

  describe('get', () => {
    it('should return an error if key is empty', async () => {
      const result = await kvStoreClient.get(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
        ''
      );
      expect(result).toEqual(Error('Key can not be empty'));
    });

    it('should return an error if address is not valid', async () => {
      const result = await kvStoreClient.get('invalid_address', 'key1');
      expect(result).toEqual(Error('Address not valid'));
    });

    it('should return empty string if both address and key are valid', async () => {
      const result = await kvStoreClient.get(
        '0x42d75a16b04a02d1abd7f2386b1c5b567bc7ef71',
        'key1'
      );
      expect(result).toBe('');
    });
  });
});
