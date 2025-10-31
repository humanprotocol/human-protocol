jest.mock('@/logger');

import crypto from 'crypto';

import { faker } from '@faker-js/faker';
import nock from 'nock';

import { ExchangeApiClientError } from './errors';
import { generateMexcAccountBalance } from './fixtures';
import { MexcExchangeClient, MEXC_API_BASE_URL } from './mexc-exchange.client';

describe('MexcExchangeClient', () => {
  afterAll(() => {
    nock.restore();
  });

  afterEach(() => {
    jest.resetAllMocks();
    nock.cleanAll();
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
      const timeoutMs = faker.number.int();

      const client = new MexcExchangeClient(
        { apiKey, secretKey },
        { timeoutMs: timeoutMs },
      );

      expect(client).toBeDefined();
      expect(client['apiKey']).toBe(apiKey);
      expect(client['secretKey']).toBe(secretKey);
      expect(client['timeoutMs']).toBe(timeoutMs);
    });
  });

  describe('signQuery', () => {
    it('returns a valid signature', () => {
      const apiKey = faker.string.sample();
      const secretKey = faker.string.sample();
      const query = faker.string.sample();

      const client = new MexcExchangeClient({ apiKey, secretKey });

      const signature = client['signQuery'](query);

      const expectedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(query)
        .digest('hex');
      expect(signature).toBe(expectedSignature);
    });

    it('getSignedQuery returns correct structure and signature', () => {
      const apiKey = faker.string.sample();
      const secretKey = faker.string.sample();
      const timestamp = faker.number.int();
      const client = new MexcExchangeClient({ apiKey, secretKey });

      jest.spyOn(Date, 'now').mockReturnValue(timestamp);
      const result = client['getSignedQuery']();
      expect(result).toHaveProperty('query');
      expect(result).toHaveProperty('signature');
      expect(result.query).toBe(`timestamp=${timestamp}&recvWindow=5000`);

      const expectedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(result.query)
        .digest('hex');
      expect(result.signature).toBe(expectedSignature);
      jest.restoreAllMocks();
    });
  });

  describe('checkRequiredAccess', () => {
    const path = '/account';

    it('returns true if fetch is ok', async () => {
      const apiKey = faker.string.sample();
      const secretKey = faker.string.sample();
      const client = new MexcExchangeClient({ apiKey, secretKey });
      const scope = nock(MEXC_API_BASE_URL).get(path).query(true).reply(200);
      const result = await client.checkRequiredAccess();
      scope.done();
      expect(result).toBe(true);
    });

    it('returns false if fetch is not ok', async () => {
      const apiKey = faker.string.sample();
      const secretKey = faker.string.sample();
      const client = new MexcExchangeClient({ apiKey, secretKey });
      const scope = nock(MEXC_API_BASE_URL).get(path).query(true).reply(403);
      const result = await client.checkRequiredAccess();
      scope.done();
      expect(result).toBe(false);
    });

    it('throws ExchangeApiClientError on fetch error', async () => {
      const apiKey = faker.string.sample();
      const secretKey = faker.string.sample();
      const client = new MexcExchangeClient({ apiKey, secretKey });
      const scope = nock(MEXC_API_BASE_URL)
        .get(path)
        .query(true)
        .replyWithError('network error');
      await expect(client.checkRequiredAccess()).rejects.toBeInstanceOf(
        ExchangeApiClientError,
      );

      scope.done();
    });
  });

  describe('getAccountBalance', () => {
    const path = '/account';

    it('returns 0 if fetch not ok', async () => {
      const apiKey = faker.string.sample();
      const secretKey = faker.string.sample();
      const asset = faker.finance.currencyCode();
      const client = new MexcExchangeClient({ apiKey, secretKey });
      const scope = nock(MEXC_API_BASE_URL).get(path).query(true).reply(403);
      const result = await client.getAccountBalance(asset);
      scope.done();
      expect(result).toBe(0);
    });

    it('returns 0 if asset not found', async () => {
      const apiKey = faker.string.sample();
      const secretKey = faker.string.sample();
      const asset = faker.finance.currencyCode();
      const client = new MexcExchangeClient({ apiKey, secretKey });
      const scope = nock(MEXC_API_BASE_URL)
        .get(path)
        .query(true)
        .reply(200, generateMexcAccountBalance(['OTHER']));
      const result = await client.getAccountBalance(asset);
      scope.done();
      expect(result).toBe(0);
    });

    it('returns sum of free and locked if asset found', async () => {
      const apiKey = faker.string.sample();
      const secretKey = faker.string.sample();
      const asset = faker.finance.currencyCode();
      const client = new MexcExchangeClient({ apiKey, secretKey });
      const balanceFixture = generateMexcAccountBalance([asset]);
      const scope = nock(MEXC_API_BASE_URL)
        .get(path)
        .query(true)
        .reply(200, balanceFixture);
      const result = await client.getAccountBalance(asset);
      scope.done();
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
      const scope = nock(MEXC_API_BASE_URL)
        .get(path)
        .query(true)
        .replyWithError('network error');
      await expect(client.getAccountBalance(asset)).rejects.toBeInstanceOf(
        ExchangeApiClientError,
      );

      scope.done();
    });
  });
});
