import {
  EnrollExchangeApiKeysCommand,
  EnrollExchangeApiKeysDto,
  RetrieveExchangeApiKeysResponse,
} from '../model/exchange-api-keys.model';

export const EXCHANGE_NAME = 'mexc';
export const TOKEN = 'test_user_token';
export const API_KEY = 'test_api_key';
export const API_SECRET = 'test_api_secret';
export const ID = 123;

export const enrollExchangeApiKeysDtoFixture: EnrollExchangeApiKeysDto = {
  apiKey: API_KEY,
  secretKey: API_SECRET,
};

export const enrollExchangeApiKeysCommandFixture: EnrollExchangeApiKeysCommand =
  {
    apiKey: API_KEY,
    secretKey: API_SECRET,
    token: TOKEN,
    exchangeName: EXCHANGE_NAME,
  };

export const enrollExchangeApiKeysResponseFixture = {
  id: ID,
};

export const retrieveExchangeApiKeysResponseFixture: RetrieveExchangeApiKeysResponse =
  {
    apiKey: API_KEY,
  };
