jest.mock('@/logger');

import { faker } from '@faker-js/faker';

import { ExchangeApiClientError } from './errors';
import { generateMexcAccountBalance } from './fixtures';
import { MexcExchangeClient } from './mexc-exchange.client';

describe('MexcExchangeClient', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    it('throws if credentials are missing', () => {
      expect(
        () => new MexcExchangeClient({ apiKey: '', secretKey: '' }),
      ).toThrow(ExchangeApiClientError);
    });

    it('sets fields correctly', () => {
      const apiKey = faker.string.sample();
      const secretKey = faker.string.sample();

      const client = new MexcExchangeClient(
        { apiKey, secretKey },
        { timeoutMs: 1234 },
      );

      expect(client).toBeDefined();
      expect(client['apiKey']).toBe(apiKey);
      expect(client['secretKey']).toBe(secretKey);
      expect(client['timeoutMs']).toBe(1234);
    });
  });

  describe('signQuery', () => {
    it('returns a valid signature', () => {
      const apiKey = faker.string.sample();
      const secretKey = faker.string.sample();

      const client = new MexcExchangeClient({ apiKey, secretKey });

      const query = 'timestamp=123&recvWindow=5000';
      const signature = client['signQuery'](query);

      expect(typeof signature).toBe('string');
      expect(signature.length).toBeGreaterThan(0);
    });
  });

  describe('checkRequiredAccess', () => {
    it('returns true if fetch is ok', async () => {
      const apiKey = faker.string.sample();
      const secretKey = faker.string.sample();

      const client = new MexcExchangeClient({ apiKey, secretKey });

      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({}),
      } as Response);

      const result = await client.checkRequiredAccess();
      expect(result).toBe(true);
    });

    it('returns false if fetch is not ok', async () => {
      const apiKey = faker.string.sample();
      const secretKey = faker.string.sample();

      const client = new MexcExchangeClient({ apiKey, secretKey });

      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({}),
      } as Response);

      const result = await client.checkRequiredAccess();
      expect(result).toBe(false);
    });

    it('throws ExchangeApiClientError on fetch error', async () => {
      const apiKey = faker.string.sample();
      const secretKey = faker.string.sample();

      const client = new MexcExchangeClient({ apiKey, secretKey });

      jest.spyOn(global, 'fetch').mockImplementation(async () => {
        throw new Error('network error');
      });

      await expect(client.checkRequiredAccess()).rejects.toBeInstanceOf(
        ExchangeApiClientError,
      );
    });
  });

  describe('getAccountBalance', () => {
    it('returns 0 if fetch not ok', async () => {
      const apiKey = faker.string.sample();
      const secretKey = faker.string.sample();
      const asset = faker.finance.currencyCode();

      const client = new MexcExchangeClient({ apiKey, secretKey });

      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({}),
      } as Response);

      const result = await client.getAccountBalance(asset);
      expect(result).toBe(0);
    });

    it('returns 0 if asset not found', async () => {
      const apiKey = faker.string.sample();
      const secretKey = faker.string.sample();
      const asset = faker.finance.currencyCode();

      const client = new MexcExchangeClient({ apiKey, secretKey });

      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => generateMexcAccountBalance(['OTHER']),
      } as Response);

      const result = await client.getAccountBalance(asset);
      expect(result).toBe(0);
    });

    it('returns sum of free and locked if asset found', async () => {
      const apiKey = faker.string.sample();
      const secretKey = faker.string.sample();
      const asset = faker.finance.currencyCode();

      const client = new MexcExchangeClient({ apiKey, secretKey });

      const balanceFixture = generateMexcAccountBalance([asset]);
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => balanceFixture,
      } as Response);

      const result = await client.getAccountBalance(asset);
      expect(result).toBe(
        parseFloat(balanceFixture.balances[0].free) +
          parseFloat(balanceFixture.balances[0].locked),
      );
    });

    it('throws ExchangeApiClientError on fetch error', async () => {
      const apiKey = faker.string.sample();
      const secretKey = faker.string.sample();
      const asset = faker.finance.currencyCode();

      const client = new MexcExchangeClient({ apiKey, secretKey });

      jest.spyOn(global, 'fetch').mockImplementation(async () => {
        throw new Error('network error');
      });

      await expect(client.getAccountBalance(asset)).rejects.toBeInstanceOf(
        ExchangeApiClientError,
      );
    });
  });
});
