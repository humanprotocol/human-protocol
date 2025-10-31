jest.mock('@/logger');

import crypto from 'crypto';

import { faker } from '@faker-js/faker';
import nock from 'nock';

import { ExchangeApiClientError } from './errors';
import { generateGateAccountBalance } from './fixtures';
import {
  DEVELOP_GATE_API_BASE_URL,
  GateExchangeClient,
} from './gate-exchange.client';

describe('GateExchangeClient', () => {
  afterAll(() => {
    nock.restore();
  });

  afterEach(() => {
    jest.resetAllMocks();
    nock.cleanAll();
  });

  describe('signGateRequest', () => {
    it('returns the expected signature for known input', () => {
      const apiKey = faker.string.sample();
      const secretKey = faker.string.sample();
      const method = faker.string.sample();
      const path = faker.string.sample();
      const query = faker.string.sample();
      const body = faker.string.sample();
      const secret = faker.string.sample();
      const ts = faker.number.int().toString();

      const client = new GateExchangeClient({ apiKey, secretKey });

      const bodyHash = crypto.createHash('sha512').update(body).digest('hex');
      const payload = [method, path, query, bodyHash, ts].join('\n');
      const expectedSignature = crypto
        .createHmac('sha512', secret)
        .update(payload)
        .digest('hex');

      const signature = client['signGateRequest'](
        method,
        path,
        query,
        body,
        secret,
        ts,
      );
      expect(signature).toBe(expectedSignature);
    });
  });

  describe('constructor', () => {
    it('throws if credentials are missing', () => {
      expect(
        () => new GateExchangeClient({ apiKey: '', secretKey: '' }),
      ).toThrow(ExchangeApiClientError);
    });

    it('sets fields correctly', () => {
      const apiKey = faker.string.sample();
      const secretKey = faker.string.sample();
      const client = new GateExchangeClient(
        { apiKey, secretKey },
        { timeoutMs: 1234 },
      );
      expect(client).toBeDefined();
      expect(client['apiKey']).toBe(apiKey);
      expect(client['secretKey']).toBe(secretKey);
      expect(client['timeoutMs']).toBe(1234);
    });
  });

  describe('checkRequiredAccess', () => {
    const path = '/spot/accounts';

    it('returns true if fetch is ok', async () => {
      const apiKey = faker.string.sample();
      const secretKey = faker.string.sample();
      const client = new GateExchangeClient({ apiKey, secretKey });
      const scope = nock(DEVELOP_GATE_API_BASE_URL)
        .get(path)
        .query(true)
        .reply(200);
      const result = await client.checkRequiredAccess();
      scope.done();
      expect(result).toBe(true);
    });

    it('returns false if fetch is not ok', async () => {
      const apiKey = faker.string.sample();
      const secretKey = faker.string.sample();
      const client = new GateExchangeClient({ apiKey, secretKey });
      const scope = nock(DEVELOP_GATE_API_BASE_URL)
        .get(path)
        .query(true)
        .reply(403);
      const result = await client.checkRequiredAccess();
      scope.done();
      expect(result).toBe(false);
    });

    it('throws ExchangeApiClientError on fetch error', async () => {
      const apiKey = faker.string.sample();
      const secretKey = faker.string.sample();
      const client = new GateExchangeClient({ apiKey, secretKey });
      const scope = nock(DEVELOP_GATE_API_BASE_URL)
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
    const path = '/spot/accounts';

    it('returns 0 if fetch not ok', async () => {
      const apiKey = faker.string.sample();
      const secretKey = faker.string.sample();
      const asset = faker.finance.currencyCode();
      const client = new GateExchangeClient({ apiKey, secretKey });
      const scope = nock(DEVELOP_GATE_API_BASE_URL)
        .get(path)
        .query(true)
        .reply(403);
      const result = await client.getAccountBalance(asset);
      scope.done();
      expect(result).toBe(0);
    });

    it('returns 0 if asset not found', async () => {
      const apiKey = faker.string.sample();
      const secretKey = faker.string.sample();
      const asset = faker.finance.currencyCode();
      const client = new GateExchangeClient({ apiKey, secretKey });
      const scope = nock(DEVELOP_GATE_API_BASE_URL)
        .get(path)
        .query(true)
        .reply(200, generateGateAccountBalance(['OTHER']));
      const result = await client.getAccountBalance(asset);
      scope.done();
      expect(result).toBe(0);
    });

    it('returns sum of available and locked if asset found', async () => {
      const apiKey = faker.string.sample();
      const secretKey = faker.string.sample();
      const asset = faker.finance.currencyCode();
      const client = new GateExchangeClient({ apiKey, secretKey });
      const balanceFixture = generateGateAccountBalance([asset]);
      const scope = nock(DEVELOP_GATE_API_BASE_URL)
        .get(path)
        .query(true)
        .reply(200, balanceFixture);

      const result = await client.getAccountBalance(asset);
      scope.done();
      expect(result).toBe(
        parseFloat(balanceFixture[0].available) +
          parseFloat(balanceFixture[0].locked),
      );
    });

    it('throws ExchangeApiClientError on fetch error', async () => {
      const apiKey = faker.string.sample();
      const secretKey = faker.string.sample();
      const asset = faker.finance.currencyCode();
      const client = new GateExchangeClient({ apiKey, secretKey });
      const scope = nock(DEVELOP_GATE_API_BASE_URL)
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
